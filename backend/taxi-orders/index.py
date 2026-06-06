import json
import os
import uuid

import psycopg2
import psycopg2.extras

SCHEMA = "t_p50695302_taxi_agent_alisa"

VALID_STATUSES = ("new", "assigned", "in_progress", "done", "cancelled")
DRIVER_ALLOWED_STATUSES = ("in_progress", "done")


# ---------------------------------------------------------------------------
# DB / escaping helpers
# ---------------------------------------------------------------------------

def db_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def esc(value) -> str:
    """Embed a string safely in SQL by doubling single quotes."""
    return str(value).replace("'", "''")


def new_chat_token() -> str:
    return uuid.uuid4().hex[:16]


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
    Reads X-Auth-Token from request headers, joins taxi_sessions → taxi_users
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
        f"SELECT u.id, u.login, u.role, u.full_name, u.phone, u.is_active "
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
# Serialisation helper
# ---------------------------------------------------------------------------

def serialize_order(row: dict) -> dict:
    """Convert a RealDictRow order (with optional driver_ prefixed fields) to a plain dict."""
    order = {
        "id": row["id"],
        "passenger_name": row["passenger_name"],
        "passenger_phone": row["passenger_phone"],
        "from_city": row["from_city"],
        "to_city": row["to_city"],
        "trip_date": row["trip_date"].isoformat() if row.get("trip_date") else None,
        "passengers_count": row["passengers_count"],
        "comment": row["comment"],
        "status": row["status"],
        "driver_id": row["driver_id"],
        "dispatcher_id": row["dispatcher_id"],
        "price": float(row["price"]) if row.get("price") is not None else None,
        "chat_token": row["chat_token"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }
    # Driver info injected by list/my queries via LEFT JOIN
    if "driver_full_name" in row:
        order["driver"] = (
            {
                "full_name": row["driver_full_name"],
                "phone": row["driver_phone"],
            }
            if row.get("driver_full_name")
            else None
        )
    return order


# ---------------------------------------------------------------------------
# Action handlers
# ---------------------------------------------------------------------------

def action_create(event: dict) -> dict:
    """
    Public — no auth required.
    Creates a new order and returns {id, chat_token, message}.
    """
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _err("Invalid JSON body")

    passenger_name = (body.get("passenger_name") or "").strip()
    passenger_phone = (body.get("passenger_phone") or "").strip()
    from_city = (body.get("from_city") or "").strip()
    to_city = (body.get("to_city") or "").strip()
    trip_date = (body.get("trip_date") or "").strip()
    passengers_count = body.get("passengers_count", 1)
    comment = (body.get("comment") or "").strip()

    if not passenger_name or not passenger_phone or not from_city or not to_city or not trip_date:
        return _err("passenger_name, passenger_phone, from_city, to_city, trip_date are required")

    try:
        passengers_count = int(passengers_count)
        if passengers_count < 1:
            passengers_count = 1
    except (ValueError, TypeError):
        passengers_count = 1

    chat_token = new_chat_token()

    safe_name = esc(passenger_name)
    safe_phone = esc(passenger_phone)
    safe_from = esc(from_city)
    safe_to = esc(to_city)
    safe_date = esc(trip_date)
    safe_comment = esc(comment)
    safe_chat_token = esc(chat_token)

    insert_q = (
        f"INSERT INTO {SCHEMA}.taxi_orders "
        f"(passenger_name, passenger_phone, from_city, to_city, trip_date, "
        f"passengers_count, comment, status, chat_token) "
        f"VALUES ("
        f"'{safe_name}', '{safe_phone}', '{safe_from}', '{safe_to}', '{safe_date}', "
        f"{passengers_count}, '{safe_comment}', 'new', '{safe_chat_token}'"
        f") RETURNING id"
    )

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(insert_q)
            new_id = cur.fetchone()[0]

    return _ok({
        "id": new_id,
        "chat_token": chat_token,
        "message": "Заказ принят",
    })


def action_list(event: dict) -> dict:
    """
    Dispatcher auth required.
    Returns paginated list of orders with optional status filter.
    Each order includes driver info if assigned.
    """
    user = get_current_user(event)
    if not user:
        return _err("Unauthorized", 401)
    if user["role"] != "dispatcher":
        return _err("Forbidden: dispatcher role required", 403)

    qs = event.get("queryStringParameters") or {}
    status_filter = (qs.get("status") or "").strip()

    try:
        page = max(1, int(qs.get("page", 1)))
    except (ValueError, TypeError):
        page = 1
    try:
        per_page = max(1, min(100, int(qs.get("per_page", 20))))
    except (ValueError, TypeError):
        per_page = 20

    offset = (page - 1) * per_page

    where = ""
    if status_filter and status_filter in VALID_STATUSES:
        safe_status = esc(status_filter)
        where = f"WHERE o.status = '{safe_status}'"

    count_q = (
        f"SELECT COUNT(*) FROM {SCHEMA}.taxi_orders o {where}"
    )
    list_q = (
        f"SELECT o.id, o.passenger_name, o.passenger_phone, o.from_city, o.to_city, "
        f"o.trip_date, o.passengers_count, o.comment, o.status, o.driver_id, "
        f"o.dispatcher_id, o.price, o.chat_token, o.created_at, o.updated_at, "
        f"d.full_name AS driver_full_name, d.phone AS driver_phone "
        f"FROM {SCHEMA}.taxi_orders o "
        f"LEFT JOIN {SCHEMA}.taxi_users d ON d.id = o.driver_id "
        f"{where} "
        f"ORDER BY o.created_at DESC "
        f"LIMIT {per_page} OFFSET {offset}"
    )

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(count_q)
            total = cur.fetchone()[0]
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(list_q)
            rows = cur.fetchall()

    orders = [serialize_order(dict(r)) for r in rows]
    return _ok({"orders": orders, "total": total, "page": page})


def action_my(event: dict) -> dict:
    """
    Driver auth required.
    Returns orders assigned to the current driver (status != 'cancelled'),
    ordered by trip_date DESC.
    """
    user = get_current_user(event)
    if not user:
        return _err("Unauthorized", 401)
    if user["role"] != "driver":
        return _err("Forbidden: driver role required", 403)

    driver_id = int(user["id"])
    query = (
        f"SELECT o.id, o.passenger_name, o.passenger_phone, o.from_city, o.to_city, "
        f"o.trip_date, o.passengers_count, o.comment, o.status, o.driver_id, "
        f"o.dispatcher_id, o.price, o.chat_token, o.created_at, o.updated_at "
        f"FROM {SCHEMA}.taxi_orders o "
        f"WHERE o.driver_id = {driver_id} "
        f"AND o.status != 'cancelled' "
        f"ORDER BY o.trip_date DESC"
    )

    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            rows = cur.fetchall()

    orders = [serialize_order(dict(r)) for r in rows]
    return _ok({"orders": orders})


def action_assign(event: dict) -> dict:
    """
    Dispatcher auth required.
    Assigns a driver to an order and optionally sets price.
    """
    user = get_current_user(event)
    if not user:
        return _err("Unauthorized", 401)
    if user["role"] != "dispatcher":
        return _err("Forbidden: dispatcher role required", 403)

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _err("Invalid JSON body")

    order_id = body.get("order_id")
    driver_id = body.get("driver_id")
    price = body.get("price")  # optional

    if not order_id or not driver_id:
        return _err("order_id and driver_id are required")

    try:
        order_id = int(order_id)
        driver_id = int(driver_id)
    except (ValueError, TypeError):
        return _err("order_id and driver_id must be integers")

    dispatcher_id = int(user["id"])

    price_fragment = ""
    if price is not None:
        try:
            price_val = float(price)
            price_fragment = f", price = {price_val}"
        except (ValueError, TypeError):
            return _err("price must be a number")

    update_q = (
        f"UPDATE {SCHEMA}.taxi_orders "
        f"SET driver_id = {driver_id}, status = 'assigned', "
        f"dispatcher_id = {dispatcher_id}{price_fragment}, updated_at = NOW() "
        f"WHERE id = {order_id} "
        f"RETURNING id"
    )

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(update_q)
            updated = cur.fetchone()

    if not updated:
        return _err("Order not found", 404)

    return _ok({"ok": True, "order_id": order_id})


def action_status(event: dict) -> dict:
    """
    Auth required (dispatcher or driver).
    Dispatcher can set any valid status.
    Driver can only set 'in_progress' or 'done' for their own orders.
    """
    user = get_current_user(event)
    if not user:
        return _err("Unauthorized", 401)

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _err("Invalid JSON body")

    order_id = body.get("order_id")
    new_status = (body.get("status") or "").strip()

    if not order_id:
        return _err("order_id is required")
    if not new_status:
        return _err("status is required")
    if new_status not in VALID_STATUSES:
        return _err(f"Invalid status. Allowed: {', '.join(VALID_STATUSES)}")

    try:
        order_id = int(order_id)
    except (ValueError, TypeError):
        return _err("order_id must be an integer")

    role = user["role"]
    user_id = int(user["id"])

    if role == "driver":
        if new_status not in DRIVER_ALLOWED_STATUSES:
            return _err(
                f"Drivers can only set status to: {', '.join(DRIVER_ALLOWED_STATUSES)}", 403
            )
        # Drivers may only update their own orders
        update_q = (
            f"UPDATE {SCHEMA}.taxi_orders "
            f"SET status = '{esc(new_status)}', updated_at = NOW() "
            f"WHERE id = {order_id} AND driver_id = {user_id} "
            f"RETURNING id"
        )
    else:
        # Dispatcher: no ownership restriction
        update_q = (
            f"UPDATE {SCHEMA}.taxi_orders "
            f"SET status = '{esc(new_status)}', updated_at = NOW() "
            f"WHERE id = {order_id} "
            f"RETURNING id"
        )

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(update_q)
            updated = cur.fetchone()

    if not updated:
        return _err("Order not found or access denied", 404)

    return _ok({"ok": True, "order_id": order_id, "status": new_status})


def action_get(event: dict) -> dict:
    """
    Public — no auth required.
    Looks up an order by chat_token (query param: token).
    Returns order details for the passenger chat page.
    """
    qs = event.get("queryStringParameters") or {}
    token = (qs.get("token") or "").strip()

    if not token:
        return _err("token query parameter is required")

    safe_token = esc(token)
    query = (
        f"SELECT o.id, o.passenger_name, o.passenger_phone, o.from_city, o.to_city, "
        f"o.trip_date, o.passengers_count, o.comment, o.status, o.driver_id, "
        f"o.dispatcher_id, o.price, o.chat_token, o.created_at, o.updated_at, "
        f"d.full_name AS driver_full_name, d.phone AS driver_phone "
        f"FROM {SCHEMA}.taxi_orders o "
        f"LEFT JOIN {SCHEMA}.taxi_users d ON d.id = o.driver_id "
        f"WHERE o.chat_token = '{safe_token}' "
        f"LIMIT 1"
    )

    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            row = cur.fetchone()

    if not row:
        return _err("Order not found", 404)

    return _ok({"order": serialize_order(dict(row))})


# ---------------------------------------------------------------------------
# Main handler
# ---------------------------------------------------------------------------

def handler(event: dict, context) -> dict:
    """Taxi dispatch system — orders endpoints."""

    # Always handle CORS preflight first
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

        if action == "my" and method == "GET":
            return action_my(event)

        if action == "assign" and method == "POST":
            return action_assign(event)

        if action == "status" and method == "POST":
            return action_status(event)

        if action == "get" and method == "GET":
            return action_get(event)

        return _err("Unknown action or method", 400)

    except Exception as exc:
        return _err(f"Internal server error: {exc}", 500)
