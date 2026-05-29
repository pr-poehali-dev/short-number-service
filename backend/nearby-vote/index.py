import json
import os
import urllib.request
import psycopg2

SCHEMA = "t_p25384465_short_number_service"


def _get_conn():
    return psycopg2.connect(os.environ.get("DATABASE_URL", ""))


def _get_ip(event: dict) -> str:
    ip = (
        event.get("requestContext", {}).get("identity", {}).get("sourceIp")
        or event.get("headers", {}).get("X-Forwarded-For", "unknown").split(",")[0].strip()
    )
    return ip or "unknown"


def _get_count(conn) -> int:
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.nearby_votes")
    count = cur.fetchone()[0]
    cur.close()
    return count


def handler(event: dict, context) -> dict:
    """Голосование за раздел «Быстрый ответ» с отправкой комментария в Telegram."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    if event.get('httpMethod') == 'GET':
        conn = _get_conn()
        conn.autocommit = True
        count = _get_count(conn)
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'count': count})}

    body = json.loads(event.get('body', '{}'))
    comment = (body.get('comment') or '').strip()[:500]
    ip = _get_ip(event)

    conn = _get_conn()
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute(
        f"SELECT id FROM {SCHEMA}.nearby_votes WHERE ip = %s",
        (ip,)
    )
    if cur.fetchone():
        count = _get_count(conn)
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'ok': True, 'already_voted': True, 'count': count})
        }

    cur.execute(
        f"INSERT INTO {SCHEMA}.nearby_votes (comment, ip) VALUES (%s, %s)",
        (comment or None, ip)
    )
    count = _get_count(conn)
    cur.close()
    conn.close()

    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if token and chat_id:
        comment_line = f"\n💬 <b>Комментарий:</b> {comment}" if comment else ""
        text = f"🗳 <b>Новый голос за «Быстрый ответ»</b>{comment_line}\n\n📊 Всего голосов: <b>{count}</b>"
        payload = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}).encode('utf-8')
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        try:
            urllib.request.urlopen(req)
        except Exception:
            pass

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'ok': True, 'already_voted': False, 'count': count})
    }
