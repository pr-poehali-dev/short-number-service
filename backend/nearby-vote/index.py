import json
import os
import urllib.request
import psycopg2

SCHEMA = "t_p25384465_short_number_service"

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Max-Age': '86400'
}
JSON_HEADERS = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}


def _get_conn():
    return psycopg2.connect(os.environ.get("DATABASE_URL", ""))


def _get_ip(event: dict) -> str:
    ip = (
        event.get("requestContext", {}).get("identity", {}).get("sourceIp")
        or event.get("headers", {}).get("X-Forwarded-For", "unknown").split(",")[0].strip()
    )
    return ip or "unknown"


def _is_admin(event: dict) -> bool:
    token = os.environ.get("ADMIN_TOKEN", "")
    return bool(token and event.get("headers", {}).get("X-Admin-Token", "") == token)


def _get_count(cur) -> int:
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.nearby_votes")
    return cur.fetchone()[0]


def _is_approved(cur, ip: str) -> bool:
    cur.execute(f"SELECT approved FROM {SCHEMA}.nearby_votes WHERE ip = %s LIMIT 1", (ip,))
    row = cur.fetchone()
    return bool(row and row[0])


def handler(event: dict, context) -> dict:
    """Голосование за «Быстрый ответ»: приём голоса+телефона, проверка доступа, управление белым списком."""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    # GET — счётчик голосов + статус доступа по IP
    if event.get('httpMethod') == 'GET':
        ip = _get_ip(event)
        conn = _get_conn()
        conn.autocommit = True
        cur = conn.cursor()
        count = _get_count(cur)
        approved = _is_approved(cur, ip)
        cur.execute(f"SELECT id FROM {SCHEMA}.nearby_votes WHERE ip = %s LIMIT 1", (ip,))
        voted = cur.fetchone() is not None
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': JSON_HEADERS,
            'body': json.dumps({'count': count, 'voted': voted, 'approved': approved})
        }

    body = json.loads(event.get('body', '{}'))
    action = body.get('action', '')

    # Админские действия: list / approve / reject
    if action in ('approve', 'reject', 'list'):
        if not _is_admin(event):
            return {'statusCode': 403, 'headers': JSON_HEADERS, 'body': json.dumps({'error': 'Forbidden'})}

        conn = _get_conn()
        conn.autocommit = True
        cur = conn.cursor()

        if action == 'list':
            cur.execute(
                f"SELECT id, phone, comment, ip, approved, created_at "
                f"FROM {SCHEMA}.nearby_votes ORDER BY created_at DESC"
            )
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': JSON_HEADERS,
                'body': json.dumps({'votes': [
                    {'id': r[0], 'phone': r[1], 'comment': r[2], 'ip': r[3],
                     'approved': r[4], 'created_at': str(r[5])}
                    for r in rows
                ]})
            }

        vote_id = body.get('id')
        if not vote_id:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': JSON_HEADERS, 'body': json.dumps({'error': 'id required'})}

        cur.execute(
            f"UPDATE {SCHEMA}.nearby_votes SET approved = %s WHERE id = %s",
            (action == 'approve', vote_id)
        )
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': JSON_HEADERS, 'body': json.dumps({'ok': True})}

    # POST — новый голос
    comment = (body.get('comment') or '').strip()[:500]
    phone = (body.get('phone') or '').strip()[:30]
    ip = _get_ip(event)

    conn = _get_conn()
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute(f"SELECT id FROM {SCHEMA}.nearby_votes WHERE ip = %s LIMIT 1", (ip,))
    if cur.fetchone():
        count = _get_count(cur)
        approved = _is_approved(cur, ip)
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': JSON_HEADERS,
            'body': json.dumps({'ok': True, 'already_voted': True, 'count': count, 'approved': approved})
        }

    cur.execute(
        f"INSERT INTO {SCHEMA}.nearby_votes (comment, phone, ip) VALUES (%s, %s, %s)",
        (comment or None, phone or None, ip)
    )
    count = _get_count(cur)
    cur.close()
    conn.close()

    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if token and chat_id:
        comment_line = f"\n💬 <b>Комментарий:</b> {comment}" if comment else ""
        phone_line = f"\n📱 <b>Телефон:</b> {phone}" if phone else "\n📱 <b>Телефон:</b> не указан"
        text = (
            f"🗳 <b>Новый голос за «Быстрый ответ»</b>"
            f"{phone_line}"
            f"{comment_line}"
            f"\n\n📊 Всего голосов: <b>{count}</b>"
        )
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
        'headers': JSON_HEADERS,
        'body': json.dumps({'ok': True, 'already_voted': False, 'count': count, 'approved': False})
    }
