import json
import os
from typing import Optional

import psycopg2
import psycopg2.extras


def db_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
    }


def check_auth(event: dict) -> bool:
    headers = event.get("headers") or {}
    pwd = headers.get("X-Admin-Password") or headers.get("x-admin-password") or ""
    expected = os.environ.get("ADMIN_PASSWORD", "")
    return bool(expected) and pwd == expected


def get_sessions(hours: int, only_orders: bool, search: Optional[str]):
    q = (
        "SELECT session_id, started_at, last_activity, closed_at, utm_source, utm_campaign, utm_term, utm_content, "
        "messages_count, has_error, order_sent, order_phone, order_route, order_price, "
        "last_user_message, last_alice_message "
        f"FROM alice_sessions WHERE started_at >= NOW() - INTERVAL '{int(hours)} hours' "
    )
    if only_orders:
        q += "AND order_sent = TRUE "
    if search:
        safe = search.replace("'", "''")[:60]
        q += f"AND (order_phone ILIKE '%{safe}%' OR order_route ILIKE '%{safe}%' OR last_user_message ILIKE '%{safe}%' OR utm_term ILIKE '%{safe}%') "
    q += "ORDER BY started_at DESC LIMIT 200"
    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(q)
            rows = cur.fetchall()
    out = []
    for r in rows:
        out.append({
            "session_id": r["session_id"],
            "started_at": r["started_at"].isoformat() if r["started_at"] else None,
            "last_activity": r["last_activity"].isoformat() if r["last_activity"] else None,
            "closed_at": r["closed_at"].isoformat() if r["closed_at"] else None,
            "utm_source": r["utm_source"],
            "utm_campaign": r["utm_campaign"],
            "utm_term": r["utm_term"],
            "utm_content": r["utm_content"],
            "messages_count": r["messages_count"],
            "has_error": r["has_error"],
            "order_sent": r["order_sent"],
            "order_phone": r["order_phone"],
            "order_route": r["order_route"],
            "order_price": r["order_price"],
            "last_user_message": r["last_user_message"],
            "last_alice_message": r["last_alice_message"],
        })
    return out


def get_messages(session_id: str):
    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            safe = session_id.replace("'", "''")[:64]
            cur.execute(
                f"SELECT role, content, created_at FROM alice_messages WHERE session_id = '{safe}' ORDER BY id ASC"
            )
            rows = cur.fetchall()
    return [
        {"role": r["role"], "content": r["content"], "created_at": r["created_at"].isoformat()}
        for r in rows
    ]


def get_stats(hours: int):
    with db_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"""SELECT COUNT(*) total,
                COUNT(*) FILTER (WHERE order_sent) orders,
                COUNT(*) FILTER (WHERE has_error) errors,
                COUNT(*) FILTER (WHERE messages_count >= 2) engaged,
                COUNT(*) FILTER (WHERE messages_count = 1) bounced
            FROM alice_sessions WHERE started_at >= NOW() - INTERVAL '{int(hours)} hours'"""
        )
        total, orders, errors, engaged, bounced = cur.fetchone()
        cur.execute(
            f"""SELECT utm_source, COUNT(*) cnt, COUNT(*) FILTER (WHERE order_sent) ord
            FROM alice_sessions WHERE started_at >= NOW() - INTERVAL '{int(hours)} hours'
            GROUP BY utm_source ORDER BY cnt DESC LIMIT 10"""
        )
        sources = [{"source": s or "(прямой)", "total": c, "orders": o} for s, c, o in cur.fetchall()]
        cur.execute(
            f"""SELECT order_route, COUNT(*) cnt FROM alice_sessions
            WHERE order_sent AND started_at >= NOW() - INTERVAL '{int(hours)} hours'
            GROUP BY order_route ORDER BY cnt DESC LIMIT 10"""
        )
        top_routes = [{"route": r, "count": c} for r, c in cur.fetchall()]
    return {
        "total": total, "orders": orders, "errors": errors,
        "engaged": engaged, "bounced": bounced,
        "conv_rate": round((orders / total * 100) if total else 0, 1),
        "sources": sources,
        "top_routes": top_routes,
    }


def get_prompt():
    with db_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT value, updated_at FROM alice_settings WHERE key = 'system_prompt'")
        row = cur.fetchone()
    if not row:
        return {"value": "", "updated_at": None}
    return {"value": row[0], "updated_at": row[1].isoformat()}


def save_prompt(value: str):
    with db_conn() as conn, conn.cursor() as cur:
        safe = value.replace("'", "''")
        cur.execute(
            f"INSERT INTO alice_settings (key, value, updated_at) VALUES ('system_prompt', '{safe}', NOW()) "
            f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()"
        )


def close_session(session_id: str):
    with db_conn() as conn, conn.cursor() as cur:
        safe = session_id.replace("'", "''")[:64]
        cur.execute(
            f"UPDATE alice_sessions SET closed_at = NOW() WHERE session_id = '{safe}' AND closed_at IS NULL"
        )


def handler(event: dict, context) -> dict:
    """Админка Алисы: список диалогов, детали переписки, статистика, промпт"""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")

    # close — публичный (вызывается из браузера при закрытии вкладки)
    if action == "close" and event.get("httpMethod") == "POST":
        try:
            body = json.loads(event.get("body") or "{}")
            sid = body.get("session_id")
            if sid:
                close_session(sid)
        except Exception as e:
            print(f"close failed: {e}")
        return {"statusCode": 200, "headers": {**cors(), "Content-Type": "application/json"}, "body": "{}"}

    if not check_auth(event):
        return {
            "statusCode": 401,
            "headers": {**cors(), "Content-Type": "application/json"},
            "body": json.dumps({"error": "unauthorized"}),
        }

    try:
        method = event.get("httpMethod", "GET")

        if method == "GET" and action == "sessions":
            hours = int(qs.get("hours", "24"))
            only_orders = qs.get("only_orders") == "1"
            search = qs.get("search") or None
            return _ok(get_sessions(hours, only_orders, search))

        if method == "GET" and action == "messages":
            sid = qs.get("session_id", "")
            return _ok(get_messages(sid))

        if method == "GET" and action == "stats":
            hours = int(qs.get("hours", "24"))
            return _ok(get_stats(hours))

        if method == "GET" and action == "prompt":
            return _ok(get_prompt())

        if method == "POST" and action == "prompt":
            body = json.loads(event.get("body") or "{}")
            save_prompt(body.get("value") or "")
            return _ok({"saved": True})

        return {
            "statusCode": 400,
            "headers": {**cors(), "Content-Type": "application/json"},
            "body": json.dumps({"error": "unknown action"}),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {**cors(), "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }


def _ok(data) -> dict:
    return {
        "statusCode": 200,
        "headers": {**cors(), "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False),
    }
