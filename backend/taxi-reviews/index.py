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
# Action handlers
# ---------------------------------------------------------------------------

def action_create(event: dict) -> dict:
    """
    POST action=create
    Body: {token, rating (1-5), text, passenger_name}
    No auth — passenger uses chat_token to submit a review.
    Validates: order exists, status='done', no duplicate review for this token.
    """
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _err("Invalid JSON body")

    chat_token = (body.get("token") or "").strip()
    rating_raw = body.get("rating")
    text = (body.get("text") or "").strip()
    passenger_name = (body.get("passenger_name") or "").strip()

    if not chat_token:
        return _err("token is required")
    if rating_raw is None:
        return _err("rating is required")

    try:
        rating = int(rating_raw)
    except (ValueError, TypeError):
        return _err("rating must be an integer")

    if rating < 1 or rating > 5:
        return _err("rating must be between 1 and 5")

    safe_token = esc(chat_token)

    # Fetch the order
    order_q = (
        f"SELECT id, status, passenger_name "
        f"FROM {SCHEMA}.taxi_orders "
        f"WHERE chat_token = '{safe_token}' "
        f"LIMIT 1"
    )
    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(order_q)
            order = cur.fetchone()

    if not order:
        return _err("Order not found", 404)

    if order["status"] != "done":
        return _err("Reviews can only be left for completed orders (status='done')", 422)

    # Check for duplicate review
    dup_q = (
        f"SELECT id FROM {SCHEMA}.taxi_reviews "
        f"WHERE chat_token = '{safe_token}' "
        f"LIMIT 1"
    )
    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(dup_q)
            existing = cur.fetchone()

    if existing:
        return _err("A review for this order already exists", 409)

    order_id = int(order["id"])
    # Fall back to the passenger_name stored on the order if not provided
    final_name = passenger_name or (order.get("passenger_name") or "Пассажир")
    safe_name = esc(final_name)
    safe_text = esc(text)

    insert_q = (
        f"INSERT INTO {SCHEMA}.taxi_reviews "
        f"(order_id, chat_token, rating, text, passenger_name) "
        f"VALUES ({order_id}, '{safe_token}', {rating}, '{safe_text}', '{safe_name}') "
        f"RETURNING id"
    )

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(insert_q)
            new_id = cur.fetchone()[0]

    return _ok({"ok": True, "id": new_id})


def action_list(_event: dict) -> dict:
    """
    GET action=list
    No auth required.
    Returns last 50 reviews ordered by created_at DESC.
    """
    query = (
        f"SELECT id, rating, text, passenger_name, created_at, order_id "
        f"FROM {SCHEMA}.taxi_reviews "
        f"ORDER BY created_at DESC "
        f"LIMIT 50"
    )

    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            rows = cur.fetchall()

    reviews = [
        {
            "id": r["id"],
            "rating": r["rating"],
            "text": r["text"],
            "passenger_name": r["passenger_name"],
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
            "order_id": r["order_id"],
        }
        for r in rows
    ]

    return _ok({"reviews": reviews})


# ---------------------------------------------------------------------------
# Main handler
# ---------------------------------------------------------------------------

def handler(event: dict, context) -> dict:
    """Taxi reviews — create and list passenger reviews."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    method = event.get("httpMethod", "GET")

    try:
        if action == "create" and method == "POST":
            return action_create(event)

        if action == "list" and method == "GET":
            return action_list(event)

        return _err("Unknown action or method", 400)

    except Exception as exc:
        return _err(f"Internal server error: {exc}", 500)
