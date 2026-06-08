import json
import os
import base64

import urllib.request
from rate_limit import check_rate_limit


MAX_API_BASE = "https://platform-api.max.ru"


def _auth_headers(token: str) -> dict:
    return {"Authorization": token, "Content-Type": "application/json"}


def _max_request(url: str, payload: bytes, token: str) -> dict:
    import urllib.error
    req = urllib.request.Request(url, data=payload, headers=_auth_headers(token))
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        raise RuntimeError(f"MAX API {e.code}: {error_body}")


def send_max_message(token: str, chat_id: str, text: str) -> dict:
    url = f"{MAX_API_BASE}/messages"
    payload = json.dumps({
        "recipient": {"chat_id": int(chat_id)},
        "body": {"type": "text", "text": text}
    }).encode("utf-8")
    return _max_request(url, payload, token)


def upload_photo_max(token: str, photo_bytes: bytes, photo_name: str) -> str:
    """Загружает фото через MAX API и возвращает token вложения."""
    # 1. Получить upload URL
    url = f"{MAX_API_BASE}/uploads?type=image"
    req = urllib.request.Request(url, method="POST", headers={"Authorization": token})
    resp = urllib.request.urlopen(req)
    upload_data = json.loads(resp.read().decode("utf-8"))
    upload_url = upload_data["url"]

    # 2. Загрузить файл
    boundary = "----MaxBoundaryUpload7MA4"
    body_parts = [
        (f"--{boundary}\r\nContent-Disposition: form-data; name=\"data\"; filename=\"{photo_name}\"\r\nContent-Type: image/jpeg\r\n\r\n").encode()
        + photo_bytes,
        f"--{boundary}--".encode()
    ]
    multipart_body = b"\r\n".join(body_parts)
    req2 = urllib.request.Request(
        upload_url,
        data=multipart_body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    resp2 = urllib.request.urlopen(req2)
    result = json.loads(resp2.read().decode("utf-8"))
    return result.get("token", "")


def send_max_photo(token: str, chat_id: str, photo_token: str, caption: str) -> dict:
    url = f"{MAX_API_BASE}/messages"
    payload = json.dumps({
        "recipient": {"chat_id": int(chat_id)},
        "body": {"type": "text", "text": caption},
        "attachments": [{"type": "image", "payload": {"token": photo_token}}]
    }).encode("utf-8")
    return _max_request(url, payload, token)


def handler(event: dict, context) -> dict:
    """Дублирует предложение номера или фото от пользователя в MAX-бот."""

    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400"
            },
            "body": ""
        }

    rl, _ = check_rate_limit(event, "send-suggestion-max")
    if rl:
        return rl

    body = json.loads(event.get("body", "{}"))
    mode = body.get("mode", "add")
    token = os.environ["MAX_BOT_TOKEN"]
    chat_id = os.environ["MAX_CHAT_ID"]

    if mode == "photo":
        number = body.get("number", "").strip()
        experience = body.get("experience", "").strip()
        photo_b64 = body.get("photo_base64", "")
        photo_name = body.get("photo_name", "photo.jpg")
        contact_info = body.get("contact_info", "").strip()

        MAX_PHOTO_B64 = 5 * 1024 * 1024
        if len(photo_b64) > MAX_PHOTO_B64:
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
                "body": json.dumps({"error": "Фото слишком большое. Максимум — 3.7 МБ."})
            }

        caption_parts = ["📸 Фото короткого номера на практике"]
        if number:
            caption_parts.append(f"📞 Номер: {number}")
        if experience:
            caption_parts.append(f"💬 Опыт/мысли: {experience}")
        caption_parts.append("✅ Автор разрешил использование материалов")
        caption_parts.append(f"👤 Контакт: {contact_info or '—'}")
        caption = "\n".join(caption_parts)

        photo_bytes = base64.b64decode(photo_b64)
        photo_token = upload_photo_max(token, photo_bytes, photo_name)
        result = send_max_photo(token, chat_id, photo_token, caption)

    else:
        number = body.get("number", "")
        name = body.get("name", "")
        description = body.get("description", "")
        procedure = body.get("procedure", "")
        category = body.get("category", "")
        contact_info = body.get("contact_info", "").strip()

        if mode == "add":
            text = (
                f"📬 Новый номер для добавления\n\n"
                f"📞 Номер: {number}\n"
                f"🏷 Категория: {category or '—'}\n"
                f"📛 Название: {name}\n"
                f"📝 Описание: {description}\n"
                f"🔧 Как воспользоваться: {procedure or '—'}\n"
                f"👤 Контакт: {contact_info or '—'}"
            )
        else:
            text = (
                f"✏️ Правка к существующему номеру\n\n"
                f"📞 Номер: {number}\n"
                f"🏷 Категория: {category or '—'}\n"
                f"📛 Название: {name}\n"
                f"📝 Описание: {description}\n"
                f"🔧 Как воспользоваться: {procedure or '—'}\n"
                f"👤 Контакт: {contact_info or '—'}"
            )

        result = send_max_message(token, chat_id, text)

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"ok": True, "max_result": result})
    }