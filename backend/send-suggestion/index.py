import json
import os
import urllib.request
import urllib.parse


def handler(event: dict, context) -> dict:
    """Отправляет предложение номера от пользователя в Telegram-бот."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = json.loads(event.get('body', '{}'))
    mode = body.get('mode', 'add')
    number = body.get('number', '')
    name = body.get('name', '')
    description = body.get('description', '')
    procedure = body.get('procedure', '')
    category = body.get('category', '')

    if mode == 'add':
        text = (
            f"📬 <b>Новый номер для добавления</b>\n\n"
            f"📞 <b>Номер:</b> {number}\n"
            f"🏷 <b>Категория:</b> {category or '—'}\n"
            f"📛 <b>Название:</b> {name}\n"
            f"📝 <b>Описание:</b> {description}\n"
            f"🔧 <b>Как воспользоваться:</b> {procedure or '—'}"
        )
    else:
        text = (
            f"✏️ <b>Правка к существующему номеру</b>\n\n"
            f"📞 <b>Номер:</b> {number}\n"
            f"🏷 <b>Категория:</b> {category or '—'}\n"
            f"📛 <b>Название:</b> {name}\n"
            f"📝 <b>Описание:</b> {description}\n"
            f"🔧 <b>Как воспользоваться:</b> {procedure or '—'}"
        )

    token = os.environ['TELEGRAM_BOT_TOKEN']
    chat_id = os.environ['TELEGRAM_CHAT_ID']

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }).encode('utf-8')

    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read().decode('utf-8'))

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'ok': result.get('ok', False)})
    }
