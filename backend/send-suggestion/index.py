import json
import os
import base64
import urllib.request
import urllib.parse


def handler(event: dict, context) -> dict:
    """Отправляет предложение номера или фото от пользователя в Telegram-бот."""

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
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ['TELEGRAM_CHAT_ID']

    if mode == 'photo':
        number = body.get('number', '').strip()
        experience = body.get('experience', '').strip()
        photo_b64 = body.get('photo_base64', '')
        photo_name = body.get('photo_name', 'photo.jpg')

        caption_parts = ["📸 <b>Фото короткого номера на практике</b>"]
        if number:
            caption_parts.append(f"📞 <b>Номер:</b> {number}")
        if experience:
            caption_parts.append(f"💬 <b>Опыт/мысли:</b> {experience}")
        caption_parts.append("✅ <i>Автор разрешил использование материалов</i>")
        caption = "\n".join(caption_parts)

        photo_bytes = base64.b64decode(photo_b64)

        boundary = "----FormBoundary7MA4YWxkTrZu0gW"
        body_parts = []
        body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"chat_id\"\r\n\r\n{chat_id}".encode())
        body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"caption\"\r\n\r\n{caption}".encode())
        body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"parse_mode\"\r\n\r\nHTML".encode())
        body_parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"{photo_name}\"\r\nContent-Type: image/jpeg\r\n\r\n".encode()
            + photo_bytes
        )
        body_parts.append(f"--{boundary}--".encode())
        multipart_body = b"\r\n".join(body_parts)

        url = f"https://api.telegram.org/bot{token}/sendPhoto"
        req = urllib.request.Request(
            url,
            data=multipart_body,
            headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
        )
        resp = urllib.request.urlopen(req)
        result = json.loads(resp.read().decode('utf-8'))

    else:
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
