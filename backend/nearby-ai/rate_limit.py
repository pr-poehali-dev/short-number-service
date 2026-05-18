"""
Утилита rate limiting по IP через PostgreSQL (скользящее окно).
"""
import os
import psycopg2

SCHEMA = "t_p25384465_short_number_service"

# Лимиты: endpoint -> (max_requests, window_seconds)
LIMITS = {
    "nearby":            (5, 86400),  # 5 запросов в сутки
    "nearby-ai":         (5, 86400),  # 5 запросов в сутки
    "analyze-bookmarks": (5, 86400),  # 5 запросов в сутки
    "send-suggestion":   (5, 86400),  # 5 запросов в сутки
}


def get_ip(event: dict) -> str:
    ip = (
        event.get("requestContext", {}).get("identity", {}).get("sourceIp")
        or event.get("headers", {}).get("X-Forwarded-For", "unknown").split(",")[0].strip()
    )
    return ip or "unknown"


def check_rate_limit(event: dict, endpoint: str) -> dict | None:
    """Проверяет лимит. None = ок, dict = ответ 429."""
    if endpoint not in LIMITS:
        return None
    max_requests, window_seconds = LIMITS[endpoint]
    ip = get_ip(event)
    conn = psycopg2.connect(os.environ.get("DATABASE_URL", ""))
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        f"DELETE FROM {SCHEMA}.rate_limit "
        f"WHERE endpoint = '{endpoint}' AND ip = '{ip}' "
        f"AND window_start < NOW() - INTERVAL '{window_seconds} seconds'"
    )
    cur.execute(
        f"SELECT COALESCE(SUM(requests), 0) FROM {SCHEMA}.rate_limit "
        f"WHERE endpoint = '{endpoint}' AND ip = '{ip}'"
    )
    total = cur.fetchone()[0]
    if total >= max_requests:
        cur.close()
        conn.close()
        return {
            "statusCode": 429,
            "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
            "body": f'{{"error": "Вы исчерпали лимит запросов на сегодня ({max_requests} в сутки). Попробуйте завтра.", "retry_after": {window_seconds}, "limit": {max_requests}}}'
        }
    cur.execute(
        f"INSERT INTO {SCHEMA}.rate_limit (ip, endpoint, requests, window_start) "
        f"VALUES ('{ip}', '{endpoint}', 1, NOW())"
    )
    cur.close()
    conn.close()
    return None
