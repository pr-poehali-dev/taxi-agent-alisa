import json
import os
import urllib.request

import psycopg2

TG_BOT_TOKEN = "8294092024:AAG29J99kYrTw5iCYy-f7afgO7T1iubyPSs"
TG_CHAT_ID = "-4725554768"


def db_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def send_telegram(text: str) -> bool:
    try:
        url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage"
        data_bytes = json.dumps({
            "chat_id": TG_CHAT_ID,
            "text": text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True,
        }).encode("utf-8")
        r = urllib.request.Request(url, data=data_bytes, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(r, timeout=10) as resp:
            resp.read()
        return True
    except Exception as e:
        print(f"Telegram send failed: {e}")
        return False


def build_report(hours: int = 3) -> str:
    with db_conn() as conn, conn.cursor() as cur:
        # Общая статистика
        cur.execute(
            f"""SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE order_sent = TRUE) AS orders,
                COUNT(*) FILTER (WHERE has_error = TRUE) AS errors,
                COUNT(*) FILTER (WHERE messages_count >= 2) AS engaged
            FROM alice_sessions
            WHERE started_at >= NOW() - INTERVAL '{hours} hours'"""
        )
        total, orders, errors, engaged = cur.fetchone()

        conv_rate = (orders / total * 100) if total else 0

        # Топ-5 запросов из заявок
        cur.execute(
            f"""SELECT order_route, COUNT(*) AS cnt
            FROM alice_sessions
            WHERE order_sent = TRUE AND started_at >= NOW() - INTERVAL '{hours} hours'
            GROUP BY order_route ORDER BY cnt DESC LIMIT 5"""
        )
        top_orders = cur.fetchall()

        # Топ-5 UTM-запросов БЕЗ заявки (потерянные)
        cur.execute(
            f"""SELECT utm_term, COUNT(*) AS cnt
            FROM alice_sessions
            WHERE order_sent = FALSE AND utm_term IS NOT NULL AND utm_term != ''
              AND started_at >= NOW() - INTERVAL '{hours} hours'
            GROUP BY utm_term ORDER BY cnt DESC LIMIT 5"""
        )
        lost_terms = cur.fetchall()

        # Топ-5 первых сообщений клиентов БЕЗ заявки
        cur.execute(
            f"""SELECT m.content, COUNT(DISTINCT m.session_id) AS cnt
            FROM alice_messages m
            JOIN alice_sessions s ON s.session_id = m.session_id
            WHERE m.role = 'user'
              AND s.order_sent = FALSE
              AND s.started_at >= NOW() - INTERVAL '{hours} hours'
            GROUP BY m.content ORDER BY cnt DESC LIMIT 5"""
        )
        lost_questions = cur.fetchall()

        # Последние ошибки
        cur.execute(
            f"""SELECT error_type, COUNT(*) AS cnt
            FROM alice_errors
            WHERE created_at >= NOW() - INTERVAL '{hours} hours'
            GROUP BY error_type ORDER BY cnt DESC LIMIT 5"""
        )
        error_types = cur.fetchall()

    lines = [
        f"📊 *ОТЧЁТ АЛИСЫ ЗА {hours}Ч*",
        "",
        f"👥 *Диалогов:* {total}",
        f"💬 *С активным общением:* {engaged}",
        f"✅ *Заявок отправлено:* {orders}",
        f"📈 *Конверсия:* {conv_rate:.1f}%",
        f"❌ *Ошибок:* {errors}",
    ]

    if top_orders:
        lines.append("")
        lines.append("🏆 *Топ маршрутов в заявках:*")
        for route, cnt in top_orders:
            lines.append(f"• {route} — {cnt}")

    if lost_terms:
        lines.append("")
        lines.append("🔍 *Запросы БЕЗ заявки (UTM):*")
        for term, cnt in lost_terms:
            lines.append(f"• {term[:50]} — {cnt}")

    if lost_questions:
        lines.append("")
        lines.append("💭 *Что спрашивали (но не заказали):*")
        for q, cnt in lost_questions:
            short = q.replace("\n", " ")[:80]
            lines.append(f"• «{short}» — {cnt}")

    if error_types:
        lines.append("")
        lines.append("⚠️ *Ошибки:*")
        for et, cnt in error_types:
            lines.append(f"• `{et}` — {cnt}")

    if total == 0:
        lines.append("")
        lines.append("_За этот период диалогов не было._")

    return "\n".join(lines)


def handler(event: dict, context) -> dict:
    """Отчёт по работе Алисы за последние 3 часа.
    Запускать по расписанию через триггер cron-таблицы.
    Также можно вызвать вручную через GET с параметром ?hours=24."""

    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": "",
        }

    qs = event.get("queryStringParameters") or {}
    try:
        hours = int(qs.get("hours", "3"))
    except Exception:
        hours = 3

    try:
        report_text = build_report(hours)
        sent = send_telegram(report_text)
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            },
            "body": json.dumps({"sent": sent, "preview": report_text}, ensure_ascii=False),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            },
            "body": json.dumps({"error": str(e)}, ensure_ascii=False),
        }
