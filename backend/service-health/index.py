"""
Мониторинг доступности облачных сервисов (Polza.AI, 2GIS, Telegram).
Проверяет каждый сервис, записывает результат в лог БД.
Поддерживает включение/отключение через _action: get_enabled / set_enabled.
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


def get_enabled(conn) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT value FROM {SCHEMA}.nearby_settings WHERE key = 'service_health_enabled'"
        )
        row = cur.fetchone()
    return (row[0].lower() == "true") if row else False


def set_enabled(conn, enabled: bool):
    with conn.cursor() as cur:
        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.nearby_settings (key, value, updated_at)
            VALUES ('service_health_enabled', %s, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
            """,
            ("true" if enabled else "false",),
        )
    conn.commit()


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
            SELECT service_name, status, http_code, response_ms, error_message,
                   checked_at
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

    action = body.get("_action") or event.get("queryStringParameters", {}).get("_action")

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

    enabled = get_enabled(conn)

    if not enabled:
        results = get_last_known_results(conn)
        incidents = get_recent_incidents(conn)
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
                "checked_at": datetime.now(timezone.utc).isoformat(),
            },
            ensure_ascii=False,
        ),
    }
