"""
Общая утилита rate limiting по IP через PostgreSQL.
Использует скользящее окно (sliding window) с очисткой старых записей.
"""
import os
import psycopg2

SCHEMA = "t_p25384465_short_number_service"

# Лимиты: endpoint -> (max_requests, window_seconds)
LIMITS = {
    "nearby":            (20, 60),   # 20 запросов в минуту
    "nearby-ai":         (5,  60),   # 5 запросов в минуту (GPT дорогой)
    "analyze-bookmarks": (5,  60),   # 5 запросов в минуту (GPT дорогой)
    "send-suggestion":   (10, 60),   # 10 запросов в минуту
}


def get_ip(event: dict) -> str:
    ip = (
        event.get("requestContext", {}).get("identity", {}).get("sourceIp")
        or event.get("headers", {}).get("X-Forwarded-For", "unknown").split(",")[0].strip()
    )
    return ip or "unknown"


def check_rate_limit(event: dict, endpoint: str) -> dict | None:
    """
    Проверяет лимит запросов для IP.
    Возвращает None если всё ок, или dict с ответом 429 если лимит превышен.
    """
    if endpoint not in LIMITS:
        return None

    max_requests, window_seconds = LIMITS[endpoint]
    ip = get_ip(event)

    dsn = os.environ.get("DATABASE_URL", "")
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    # Удаляем устаревшие записи
    cur.execute(
        f"DELETE FROM {SCHEMA}.rate_limit "
        f"WHERE endpoint = '{endpoint}' AND ip = '{ip}' "
        f"AND window_start < NOW() - INTERVAL '{window_seconds} seconds'"
    )

    # Считаем сумму запросов в текущем окне
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
            "body": f'{{"error": "Слишком много запросов. Попробуйте через {window_seconds} секунд.", "retry_after": {window_seconds}}}'
        }

    # Увеличиваем счётчик
    cur.execute(
        f"INSERT INTO {SCHEMA}.rate_limit (ip, endpoint, requests, window_start) "
        f"VALUES ('{ip}', '{endpoint}', 1, NOW())"
    )

    cur.close()
    conn.close()
    return None
