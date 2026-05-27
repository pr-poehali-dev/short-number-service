import json
import os
import psycopg2


BANNER_KEYS = {'enabled', 'type', 'title', 'text', 'button_label', 'button_url', 'interval_hours'}
BANNER_SECTIONS = {'home', 'directory', 'nearby', 'faq'}
BANNER_DEFAULTS = {
    'home':      {'enabled': 'true', 'type': 'subscribe', 'title': 'Полный доступ к справочнику', 'text': 'Подпишитесь на новости, чтобы следить за пульсом интернет-сервиса.', 'button_label': 'Подписаться', 'button_url': 'https://t.me/qrnumber', 'interval_hours': '24'},
    'directory': {'enabled': 'true', 'type': 'subscribe', 'title': 'Будьте в курсе обновлений', 'text': 'Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы', 'button_label': 'Подписаться', 'button_url': 'https://t.me/qrnumber', 'interval_hours': '24'},
    'nearby':    {'enabled': 'true', 'type': 'subscribe', 'title': 'Будьте в курсе обновлений', 'text': 'Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы', 'button_label': 'Подписаться', 'button_url': 'https://t.me/qrnumber', 'interval_hours': '24'},
    'faq':       {'enabled': 'true', 'type': 'subscribe', 'title': 'Будьте в курсе обновлений', 'text': 'Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы', 'button_label': 'Подписаться', 'button_url': 'https://t.me/qrnumber', 'interval_hours': '24'},
}

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Max-Age': '86400',
}


def handler(event: dict, context) -> dict:
    """Управление настройками рекламных баннеров: чтение и обновление по секциям."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    schema = os.environ.get('MAIN_DB_SCHEMA', 't_p25384465_short_number_service')
    cur = conn.cursor()
    body = json.loads(event.get('body') or '{}')
    action = body.get('_action')

    if action == 'get_banner':
        section = body.get('section', 'directory')
        if section not in BANNER_SECTIONS:
            section = 'directory'
        cur.execute(f"SELECT key, value FROM {schema}.banner_settings WHERE section = %s", (section,))
        rows = cur.fetchall()
        settings = dict(BANNER_DEFAULTS[section])
        for k, v in rows:
            settings[k] = v
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps(settings)
        }

    if action == 'update_banner':
        admin_token = os.environ.get('ADMIN_TOKEN', '')
        if not admin_token or event.get('headers', {}).get('X-Admin-Token', '') != admin_token:
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Forbidden'})
            }
        section = body.get('section', 'directory')
        if section not in BANNER_SECTIONS:
            section = 'directory'
        for k, v in body.items():
            if k not in BANNER_KEYS:
                continue
            cur.execute(
                f"INSERT INTO {schema}.banner_settings (key, value, section) VALUES (%s, %s, %s) "
                f"ON CONFLICT (key, section) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (k, str(v), section)
            )
        conn.commit()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True})
        }

    conn.close()
    return {
        'statusCode': 400,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'unknown action'})
    }
