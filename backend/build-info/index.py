"""
Возвращает зафиксированное время деплоя из БД.
POST /?_action=update — обновляет время (вызывается при деплое через тест).
"""

import json
import os
import psycopg2
from datetime import datetime, timezone, timedelta

SCHEMA = "t_p25384465_short_number_service"
MSK = timezone(timedelta(hours=3))


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def now_msk():
    return datetime.now(tz=MSK).strftime("%d.%m.%Y, %H:%M")


def handler(event: dict, context) -> dict:
    cors = {"Access-Control-Allow-Origin": "*"}

    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {**cors, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"},
            "body": "",
        }

    action = (event.get("queryStringParameters") or {}).get("_action")

    conn = get_db()
    try:
        if action == "update":
            t = now_msk()
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    INSERT INTO {SCHEMA}.nearby_settings (key, value, updated_at)
                    VALUES ('deploy_time', %s, NOW())
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
                    """,
                    (t,),
                )
            conn.commit()
            build_time = t
        else:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT value FROM {SCHEMA}.nearby_settings WHERE key = 'deploy_time'"
                )
                row = cur.fetchone()
            build_time = row[0] if row else "—"
    finally:
        conn.close()

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({"build_time": build_time}),
    }
