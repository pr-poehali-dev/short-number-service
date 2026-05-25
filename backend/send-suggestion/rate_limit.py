"""
Утилита rate limiting по IP через PostgreSQL.
Сброс лимита — ровно в полночь по московскому времени (UTC+3).
"""
import os
import psycopg2

SCHEMA = "t_p25384465_short_number_service"

# Лимиты: endpoint -> max_requests_per_day
LIMITS = {
    "nearby":          5,
    "send-suggestion": 5,
}


def get_ip(event: dict) -> str:
    ip = (
        event.get("requestContext", {}).get("identity", {}).get("sourceIp")
        or event.get("headers", {}).get("X-Forwarded-For", "unknown").split(",")[0].strip()
    )
    return ip or "unknown"


def _get_conn():
    return psycopg2.connect(os.environ.get("DATABASE_URL", ""))


def _msk_today_expr() -> str:
    """SQL-выражение для текущей даты в МСК (UTC+3)."""
    return "(NOW() AT TIME ZONE 'Europe/Moscow')::date"


def get_remaining(event: dict, endpoint: str) -> int:
    """Возвращает количество оставшихся запросов для IP (без списания)."""
    if endpoint not in LIMITS:
        return 999
    max_requests = LIMITS[endpoint]
    ip = get_ip(event)
    conn = _get_conn()
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        f"SELECT COALESCE(SUM(requests), 0) FROM {SCHEMA}.rate_limit "
        f"WHERE endpoint = '{endpoint}' AND ip = '{ip}' "
        f"AND window_start::date = {_msk_today_expr()}"
    )
    total = int(cur.fetchone()[0])
    cur.close()
    conn.close()
    return max(0, max_requests - total)


def _is_admin(event: dict) -> bool:
    token = os.environ.get("ADMIN_TOKEN", "")
    if not token:
        return False
    return event.get("headers", {}).get("X-Admin-Token", "") == token


def check_rate_limit(event: dict, endpoint: str) -> tuple[dict | None, int]:
    """
    Проверяет лимит и списывает 1 запрос.
    Сброс — в полночь по МСК.
    Возвращает (None, remaining) если ок, (dict_429, 0) если лимит превышен.
    """
    if _is_admin(event):
        return None, 999
    if endpoint not in LIMITS:
        return None, 999
    max_requests = LIMITS[endpoint]
    ip = get_ip(event)
    conn = _get_conn()
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        f"SELECT COALESCE(SUM(requests), 0) FROM {SCHEMA}.rate_limit "
        f"WHERE endpoint = '{endpoint}' AND ip = '{ip}' "
        f"AND window_start::date = {_msk_today_expr()}"
    )
    total = int(cur.fetchone()[0])
    if total >= max_requests:
        cur.close()
        conn.close()
        return {
            "statusCode": 429,
            "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
            "body": f'{{"error": "Вы исчерпали лимит запросов на сегодня ({max_requests} в сутки). Попробуйте завтра.", "limit": {max_requests}, "remaining": 0}}'
        }, 0
    cur.execute(
        f"INSERT INTO {SCHEMA}.rate_limit (ip, endpoint, requests, window_start) "
        f"VALUES ('{ip}', '{endpoint}', 1, NOW())"
    )
    cur.close()
    conn.close()
    remaining = max_requests - total - 1
    return None, remaining