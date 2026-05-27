"""
Мониторинг доступности облачных сервисов (Polza.AI, 2GIS, Telegram).
Проверяет каждый сервис, записывает результат в лог БД.
Поддерживает:
- включение/отключение: _action=get_enabled / set_enabled
- настройки интервала опроса: _action=get_poll_settings / set_poll_settings
- статистика потребления: _action=get_stats
Когда отключён — возвращает последние данные из БД без новых проверок.
"""

import json
import os
import time
import urllib.request
import urllib.error
import psycopg2
from datetime import datetime, timezone

SCHEMA = "t_p25384465_short_number_service"

SERVICES = [
    {
        "name": "Polza.AI",
        "url": "https://api.polza.ai/api/v1/models",
        "method": "GET",
        "timeout": 8,
        "headers": {},
        "expected_codes": [200, 401, 403],
    },
    {
        "name": "2GIS",
        "url": "https://catalog.api.2gis.com/3.0/items?key=demo&q=test&point=37.6,55.7&radius=100&type=branch",
        "method": "GET",
        "timeout": 8,
        "headers": {},
        "expected_codes": [200, 403, 404],
    },
    {
        "name": "Telegram",
        "url": "https://api.telegram.org",
        "method": "GET",
        "timeout": 8,
        "headers": {},
        "expected_codes": [200, 404],
    },
]

FUNCTION_TIMEOUTS = {
    "service-health": 30,
    "nearby": 30,
    "analyze-bookmarks": 30,
    "send-suggestion": 30,
}


def check_service(service: dict) -> dict:
    start = time.time()
    try:
        req = urllib.request.Request(
            service["url"],
            method=service["method"],
            headers=service["headers"],
        )
        with urllib.request.urlopen(req, timeout=service["timeout"]) as resp:
            http_code = resp.status
            elapsed = int((time.time() - start) * 1000)
            ok = http_code in service["expected_codes"]
            return {
                "status": "ok" if ok else "degraded",
                "http_code": http_code,
                "response_ms": elapsed,
                "error_message": None,
            }
    except urllib.error.HTTPError as e:
        elapsed = int((time.time() - start) * 1000)
        ok = e.code in service["expected_codes"]
        return {
            "status": "ok" if ok else "degraded",
            "http_code": e.code,
            "response_ms": elapsed,
            "error_message": None if ok else f"HTTP {e.code}",
        }
    except Exception as e:
        elapsed = int((time.time() - start) * 1000)
        return {
            "status": "down",
            "http_code": None,
            "response_ms": elapsed,
            "error_message": str(e)[:300],
        }


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_setting(conn, key: str, default: str) -> str:
    with conn.cursor() as cur:
        cur.execute(f"SELECT value FROM {SCHEMA}.nearby_settings WHERE key = %s", (key,))
        row = cur.fetchone()
    return row[0] if row else default


def set_setting(conn, key: str, value: str):
    with conn.cursor() as cur:
        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.nearby_settings (key, value, updated_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
            """,
            (key, value),
        )
    conn.commit()


def get_enabled(conn) -> bool:
    return get_setting(conn, "service_health_enabled", "false").lower() == "true"


def set_enabled(conn, enabled: bool):
    set_setting(conn, "service_health_enabled", "true" if enabled else "false")


def get_poll_settings(conn) -> dict:
    return {
        "interval_active": int(get_setting(conn, "poll_interval_active", "5")),
        "interval_new": int(get_setting(conn, "poll_interval_new", "30")),
    }


def set_poll_settings(conn, interval_active: int, interval_new: int):
    set_setting(conn, "poll_interval_active", str(max(1, min(60, interval_active))))
    set_setting(conn, "poll_interval_new", str(max(1, min(120, interval_new))))


def get_stats(conn) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT
                service_name,
                COUNT(*) as calls,
                ROUND(AVG(response_ms)) as avg_ms,
                SUM(response_ms) / 1000 as total_seconds
            FROM {SCHEMA}.service_availability_log
            WHERE checked_at >= NOW() - INTERVAL '30 days'
            GROUP BY service_name
            ORDER BY calls DESC
            """
        )
        rows = cur.fetchall()
    service_stats = [
        {
            "name": r[0],
            "calls_30d": r[1],
            "avg_ms": int(r[2]) if r[2] else 0,
            "total_seconds": int(r[3]) if r[3] else 0,
        }
        for r in rows
    ]

    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT endpoint, SUM(requests) as total_calls
            FROM {SCHEMA}.rate_limit
            WHERE window_start >= NOW() - INTERVAL '30 days'
            GROUP BY endpoint
            ORDER BY total_calls DESC
            """
        )
        rows = cur.fetchall()
    endpoint_stats = [
        {"endpoint": r[0], "calls_30d": int(r[1])}
        for r in rows
    ]

    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT COUNT(*) as total, SUM(response_ms) / 1000 as total_sec
            FROM {SCHEMA}.service_availability_log
            WHERE checked_at >= NOW() - INTERVAL '30 days'
            """
        )
        row = cur.fetchone()
    total_health_calls = int(row[0]) if row[0] else 0
    total_health_seconds = int(row[1]) if row[1] else 0

    return {
        "service_health": {
            "calls_30d": total_health_calls,
            "real_response_seconds": total_health_seconds,
            "by_service": service_stats,
        },
        "other_functions": endpoint_stats,
    }


def save_log(conn, service_name: str, service_url: str, result: dict):
    with conn.cursor() as cur:
        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.service_availability_log
              (service_name, service_url, status, http_code, response_ms, error_message, checked_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """,
            (
                service_name,
                service_url,
                result["status"],
                result["http_code"],
                result["response_ms"],
                result["error_message"],
            ),
        )
    conn.commit()


def get_recent_incidents(conn, limit: int = 50) -> list:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT service_name, status, http_code, response_ms, error_message, checked_at
            FROM {SCHEMA}.service_availability_log
            WHERE status != 'ok'
            ORDER BY checked_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        rows = cur.fetchall()
    return [
        {
            "service": r[0],
            "status": r[1],
            "http_code": r[2],
            "response_ms": r[3],
            "error": r[4],
            "checked_at": r[5].isoformat() if r[5] else None,
        }
        for r in rows
    ]


def get_last_known_results(conn) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT DISTINCT ON (service_name)
                service_name, status, http_code, response_ms, error_message
            FROM {SCHEMA}.service_availability_log
            ORDER BY service_name, checked_at DESC
            """
        )
        rows = cur.fetchall()
    return {
        r[0]: {
            "status": r[1],
            "http_code": r[2],
            "response_ms": r[3],
            "error": r[4],
        }
        for r in rows
    }


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    conn = get_db()

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    action = body.get("_action") or (event.get("queryStringParameters") or {}).get("_action")

    if action == "get_enabled":
        enabled = get_enabled(conn)
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"enabled": enabled}),
        }

    if action == "set_enabled":
        enabled = bool(body.get("enabled", False))
        set_enabled(conn, enabled)
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "enabled": enabled}),
        }

    if action == "get_poll_settings":
        settings = get_poll_settings(conn)
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps(settings),
        }

    if action == "set_poll_settings":
        interval_active = int(body.get("interval_active", 5))
        interval_new = int(body.get("interval_new", 30))
        set_poll_settings(conn, interval_active, interval_new)
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "interval_active": interval_active, "interval_new": interval_new}),
        }

    if action == "get_stats":
        stats = get_stats(conn)
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps(stats, ensure_ascii=False),
        }

    enabled = get_enabled(conn)

    if not enabled:
        results = get_last_known_results(conn)
        incidents = get_recent_incidents(conn)
        poll_settings = get_poll_settings(conn)
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "ok": True,
                    "enabled": False,
                    "services": results,
                    "incidents": incidents,
                    "poll_settings": poll_settings,
                    "checked_at": datetime.now(timezone.utc).isoformat(),
                },
                ensure_ascii=False,
            ),
        }

    results = {}
    for service in SERVICES:
        result = check_service(service)
        results[service["name"]] = {
            "status": result["status"],
            "http_code": result["http_code"],
            "response_ms": result["response_ms"],
            "error": result["error_message"],
        }
        save_log(conn, service["name"], service["url"], result)

    incidents = get_recent_incidents(conn)
    poll_settings = get_poll_settings(conn)
    conn.close()

    has_issues = any(v["status"] != "ok" for v in results.values())

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps(
            {
                "ok": not has_issues,
                "enabled": True,
                "services": results,
                "incidents": incidents,
                "poll_settings": poll_settings,
                "checked_at": datetime.now(timezone.utc).isoformat(),
            },
            ensure_ascii=False,
        ),
    }
