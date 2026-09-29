import json
import os
import psycopg2

SCHEMA = "t_p25384465_short_number_service"


def get_ip(event: dict) -> str:
    ip = (
        event.get("requestContext", {}).get("identity", {}).get("sourceIp")
        or event.get("headers", {}).get("X-Forwarded-For", "unknown").split(",")[0].strip()
    )
    return ip or "unknown"


def handler(event: dict, context) -> dict:
    """Фиксирует установку сайта как PWA-приложения и отдаёт счётчик установок для админ-панели.
    POST { } — записывает факт установки (platform, user_agent, ip).
    GET / POST { "_action": "get_count" } — возвращает общее количество установок.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    method = event.get('httpMethod', 'GET')
    body = {}
    if method == 'POST':
        try:
            body = json.loads(event.get('body') or '{}')
        except json.JSONDecodeError:
            body = {}

    action = body.get('_action')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()

        if method == 'GET' or action == 'get_count':
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.pwa_installs")
            count = cur.fetchone()[0]
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'count': count}),
            }

        platform = str(body.get('platform', ''))[:100]
        user_agent = str(event.get('headers', {}).get('User-Agent', ''))[:500]
        ip = get_ip(event)

        cur.execute(
            f"INSERT INTO {SCHEMA}.pwa_installs (platform, user_agent, ip) VALUES (%s, %s, %s)",
            (platform, user_agent, ip),
        )
        conn.commit()

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.pwa_installs")
        count = cur.fetchone()[0]

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True, 'count': count}),
        }
    finally:
        conn.close()
