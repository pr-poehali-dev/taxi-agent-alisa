import json
import os

import psycopg2
import psycopg2.extras

SCHEMA = "t_p50695302_taxi_agent_alisa"


# ---------------------------------------------------------------------------
# DB / escaping helpers
# ---------------------------------------------------------------------------

def db_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def esc(value) -> str:
    """Embed a string safely in SQL by doubling single quotes."""
    return str(value).replace("'", "''")


# ---------------------------------------------------------------------------
# CORS / response helpers
# ---------------------------------------------------------------------------

def cors() -> dict:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    }


def _ok(data, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": {**cors(), "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def _err(message: str, status: int = 400) -> dict:
    return {
        "statusCode": status,
        "headers": {**cors(), "Content-Type": "application/json"},
        "body": json.dumps({"error": message}, ensure_ascii=False),
    }


# ---------------------------------------------------------------------------
# Auth helper
# ---------------------------------------------------------------------------

def get_current_user(event: dict):
    """
    Reads X-Auth-Token from headers, joins taxi_sessions → taxi_users
    filtering on non-expired sessions and active users.
    Returns a dict or None.
    """
    headers = event.get("headers") or {}
    token = (
        headers.get("X-Auth-Token")
        or headers.get("x-auth-token")
        or ""
    ).strip()
    if not token:
        return None

    safe_token = esc(token)
    query = (
        f"SELECT u.id, u.role, u.full_name "
        f"FROM {SCHEMA}.taxi_sessions s "
        f"JOIN {SCHEMA}.taxi_users u ON u.id = s.user_id "
        f"WHERE s.id = '{safe_token}' "
        f"AND s.expires_at > NOW() "
        f"AND u.is_active = TRUE "
        f"LIMIT 1"
    )
    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            row = cur.fetchone()
    if not row:
        return None
    return dict(row)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_order_by_chat_token(chat_token: str):
    """Returns the order row (id, status, passenger_name) or None."""
    safe = esc(chat_token)
    query = (
        f"SELECT id, status, passenger_name "
        f"FROM {SCHEMA}.taxi_orders "
        f"WHERE chat_token = '{safe}' "
        f"LIMIT 1"
    )
    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            row = cur.fetchone()
    return dict(row) if row else None


# ---------------------------------------------------------------------------
# Action handlers
# ---------------------------------------------------------------------------

def action_messages(event: dict) -> dict:
    """
    GET action=messages
    Query param: token (chat_token)
    No auth required — passenger accesses their order by token.
    Returns {messages: [...], order_id}
    """
    qs = event.get("queryStringParameters") or {}
    chat_token = (qs.get("token") or "").strip()

    if not chat_token:
        return _err("token query parameter is required")

    order = get_order_by_chat_token(chat_token)
    if not order:
        return _err("Order not found", 404)

    order_id = int(order["id"])

    query = (
        f"SELECT id, sender_role, sender_name, text, created_at "
        f"FROM {SCHEMA}.taxi_chat_messages "
        f"WHERE order_id = {order_id} "
        f"ORDER BY id ASC"
    )

    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            rows = cur.fetchall()

    messages = [
        {
            "id": r["id"],
            "sender_role": r["sender_role"],
            "sender_name": r["sender_name"],
            "text": r["text"],
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]

    return _ok({"messages": messages, "order_id": order_id})


def action_send(event: dict) -> dict:
    """
    POST action=send
    Body: {token, text, sender_name (for passenger)}
    If X-Auth-Token present → staff sender (dispatcher/driver).
    If absent → passenger sender, uses sender_name from body.
    """
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _err("Invalid JSON body")

    chat_token = (body.get("token") or "").strip()
    text = (body.get("text") or "").strip()

    if not chat_token:
        return _err("token is required")
    if not text:
        return _err("text is required")

    order = get_order_by_chat_token(chat_token)
    if not order:
        return _err("Order not found", 404)

    order_id = int(order["id"])

    # Determine sender identity
    user = get_current_user(event)
    if user:
        sender_role = user["role"]          # 'dispatcher' or 'driver'
        sender_name = user["full_name"] or sender_role
    else:
        sender_role = "passenger"
        sender_name = (body.get("sender_name") or order.get("passenger_name") or "Пассажир").strip()

    safe_role = esc(sender_role)
    safe_name = esc(sender_name)
    safe_text = esc(text)

    insert_q = (
        f"INSERT INTO {SCHEMA}.taxi_chat_messages "
        f"(order_id, sender_role, sender_name, text) "
        f"VALUES ({order_id}, '{safe_role}', '{safe_name}', '{safe_text}') "
        f"RETURNING id"
    )

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(insert_q)
            new_id = cur.fetchone()[0]

    return _ok({"id": new_id, "ok": True})


# ---------------------------------------------------------------------------
# Main handler
# ---------------------------------------------------------------------------

def handler(event: dict, context) -> dict:
    """Taxi chat — messages read/write endpoints."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    method = event.get("httpMethod", "GET")

    try:
        if action == "messages" and method == "GET":
            return action_messages(event)

        if action == "send" and method == "POST":
            return action_send(event)

        return _err("Unknown action or method", 400)

    except Exception as exc:
        return _err(f"Internal server error: {exc}", 500)
