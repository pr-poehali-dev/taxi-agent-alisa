import hashlib
import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import psycopg2
import psycopg2.extras

SCHEMA = "t_p50695302_taxi_agent_alisa"
SESSION_TTL_HOURS = 24


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def db_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def esc(value: str) -> str:
    """Escape a string value for safe embedding in SQL (doubles single quotes)."""
    return str(value).replace("'", "''")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def new_token() -> str:
    return uuid.uuid4().hex


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

def cors() -> dict:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-User-Id",
    }


def _ok(data, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": {**cors(), "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False),
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
    Reads X-Auth-Token from headers, looks up a non-expired session,
    returns a dict with user fields or None.
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
# Action handlers
# ---------------------------------------------------------------------------

def action_login(event: dict) -> dict:
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _err("Invalid JSON body")

    login = (body.get("login") or "").strip()
    password = (body.get("password") or "").strip()

    if not login or not password:
        return _err("login and password are required")

    pw_hash = hash_password(password)
    safe_login = esc(login)
    safe_hash = esc(pw_hash)

    query = (
        f"SELECT id, login, role, full_name, phone FROM {SCHEMA}.taxi_users "
        f"WHERE login = '{safe_login}' "
        f"AND password_hash = '{safe_hash}' "
        f"AND is_active = TRUE "
        f"LIMIT 1"
    )

    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            user = cur.fetchone()

    if not user:
        return _err("Invalid credentials", 401)

    token = new_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)
    expires_str = expires_at.strftime("%Y-%m-%d %H:%M:%S+00")

    insert_q = (
        f"INSERT INTO {SCHEMA}.taxi_sessions (id, user_id, expires_at) "
        f"VALUES ('{token}', {int(user['id'])}, '{expires_str}')"
    )

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(insert_q)

    return _ok({
        "token": token,
        "user": {
            "id": user["id"],
            "login": user["login"],
            "role": user["role"],
            "full_name": user["full_name"],
        },
    })


def action_logout(event: dict) -> dict:
    headers = event.get("headers") or {}
    token = (
        headers.get("X-Auth-Token")
        or headers.get("x-auth-token")
        or ""
    ).strip()

    if not token:
        return _err("Missing X-Auth-Token header", 401)

    safe_token = esc(token)
    delete_q = f"DELETE FROM {SCHEMA}.taxi_sessions WHERE id = '{safe_token}'"

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(delete_q)

    return _ok({"ok": True})


def action_me(event: dict) -> dict:
    user = get_current_user(event)
    if not user:
        return _err("Unauthorized", 401)

    return _ok({
        "id": user["id"],
        "login": user["login"],
        "role": user["role"],
        "full_name": user["full_name"],
        "phone": user["phone"],
    })


def action_seed(_event: dict) -> dict:
    """Creates the default dispatcher account if it does not already exist."""
    default_login = "dispatcher"
    default_password = "admin123"
    default_full_name = "Default Dispatcher"

    pw_hash = hash_password(default_password)
    safe_login = esc(default_login)

    check_q = (
        f"SELECT id FROM {SCHEMA}.taxi_users "
        f"WHERE login = '{safe_login}' LIMIT 1"
    )

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(check_q)
            existing = cur.fetchone()

    if existing:
        return _ok({"ok": True, "message": "Dispatcher already exists"})

    safe_hash = esc(pw_hash)
    safe_full_name = esc(default_full_name)

    insert_q = (
        f"INSERT INTO {SCHEMA}.taxi_users (login, password_hash, role, full_name, is_active) "
        f"VALUES ('{safe_login}', '{safe_hash}', 'dispatcher', '{safe_full_name}', TRUE)"
    )

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(insert_q)

    return _ok({"ok": True, "message": "Default dispatcher created"})


def action_list_drivers(event: dict) -> dict:
    """Dispatcher-only: return all driver accounts."""
    current_user = get_current_user(event)
    if not current_user:
        return _err("Unauthorized", 401)
    if current_user["role"] != "dispatcher":
        return _err("Forbidden: dispatcher role required", 403)

    query = (
        f"SELECT id, login, full_name, phone, is_active "
        f"FROM {SCHEMA}.taxi_users "
        f"WHERE role = 'driver' "
        f"ORDER BY full_name ASC"
    )
    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            rows = cur.fetchall()

    drivers = [
        {
            "id": r["id"],
            "login": r["login"],
            "full_name": r["full_name"],
            "phone": r["phone"],
            "is_active": r["is_active"],
        }
        for r in rows
    ]
    return _ok({"drivers": drivers})


def action_create_driver(event: dict) -> dict:
    """Dispatcher-only: create a new driver account."""
    current_user = get_current_user(event)
    if not current_user:
        return _err("Unauthorized", 401)
    if current_user["role"] != "dispatcher":
        return _err("Forbidden: dispatcher role required", 403)

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return _err("Invalid JSON body")

    login = (body.get("login") or "").strip()
    password = (body.get("password") or "").strip()
    full_name = (body.get("full_name") or "").strip()
    phone = (body.get("phone") or "").strip()

    if not login or not password or not full_name:
        return _err("login, password, and full_name are required")

    safe_login = esc(login)

    # Check uniqueness
    check_q = (
        f"SELECT id FROM {SCHEMA}.taxi_users "
        f"WHERE login = '{safe_login}' LIMIT 1"
    )
    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(check_q)
            existing = cur.fetchone()

    if existing:
        return _err("A user with this login already exists", 409)

    pw_hash = hash_password(password)
    safe_hash = esc(pw_hash)
    safe_full_name = esc(full_name)
    safe_phone = esc(phone)

    insert_q = (
        f"INSERT INTO {SCHEMA}.taxi_users (login, password_hash, role, full_name, phone, is_active) "
        f"VALUES ('{safe_login}', '{safe_hash}', 'driver', '{safe_full_name}', '{safe_phone}', TRUE) "
        f"RETURNING id, login, role, full_name, phone"
    )

    with db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(insert_q)
            new_user = cur.fetchone()

    return _ok({
        "ok": True,
        "user": {
            "id": new_user["id"],
            "login": new_user["login"],
            "role": new_user["role"],
            "full_name": new_user["full_name"],
            "phone": new_user["phone"],
        },
    }, 201)


# ---------------------------------------------------------------------------
# Main handler
# ---------------------------------------------------------------------------

def handler(event: dict, context) -> dict:
    """Taxi dispatch system — authentication endpoints."""

    # Always handle CORS preflight first
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    method = event.get("httpMethod", "GET")

    try:
        if action == "login" and method == "POST":
            return action_login(event)

        if action == "logout" and method == "POST":
            return action_logout(event)

        if action == "me" and method == "GET":
            return action_me(event)

        if action == "seed" and method == "POST":
            return action_seed(event)

        if action == "list_drivers" and method == "GET":
            return action_list_drivers(event)

        if action == "create_driver" and method == "POST":
            return action_create_driver(event)

        return _err("Unknown action or method", 400)

    except Exception as exc:
        return _err(f"Internal server error: {exc}", 500)