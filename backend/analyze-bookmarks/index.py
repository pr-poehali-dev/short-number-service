import json
import os
import math
import requests


SYSTEM_PROMPT = """Ты — персональный помощник по выбору мест для посещения.
Пользователь сохранил список мест — это его личная история интересов и предпочтений.
Сейчас он находится в конкретной точке, и для каждого места указано актуальное расстояние от него.

Твоя задача:
1. Используй ВСЕ закладки для понимания предпочтений пользователя (что он любит, куда ходит).
2. Дай конкретный совет: куда лучше зайти СЕЙЧАС — с учётом близости, типа заведения и личных предпочтений.
3. Учитывай выгоду: экономию времени (ближе = лучше) и денег (тип заведения).

Отвечай по-русски, в стиле дружеского личного совета.
Начни с "Лучше всего зайти в..." и объясни почему (2-4 предложения).
Не используй списки и заголовки — только живой текст."""


def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return int(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def handler(event: dict, context) -> dict:
    """
    Принимает текущие координаты пользователя и список закладок.
    Пересчитывает актуальное расстояние от текущей позиции до каждой закладки,
    затем передаёт всё в GPT для персональной рекомендации.
    """
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

    body = json.loads(event.get('body') or '{}')
    bookmarks = body.get('bookmarks', [])
    current_lat = body.get('lat')
    current_lon = body.get('lon')

    if not bookmarks:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Нет закладок для анализа'}, ensure_ascii=False)
        }

    lines = []
    for i, bm in enumerate(bookmarks, 1):
        parts = [f"{i}. {bm.get('name', '?')} ({bm.get('type', '')})"]
        if bm.get('address'):
            parts.append(f"адрес: {bm['address']}")

        if current_lat is not None and current_lon is not None and bm.get('lat') and bm.get('lon'):
            actual_distance = haversine(current_lat, current_lon, bm['lat'], bm['lon'])
            parts.append(f"сейчас до него ~{actual_distance} м")
        elif bm.get('distance_approx'):
            parts.append(f"расстояние при сохранении: ~{bm['distance_approx']} м")

        if bm.get('description'):
            parts.append(f"описание: {bm['description']}")
        lines.append(', '.join(parts))

    location_note = ""
    if current_lat is not None and current_lon is not None:
        location_note = f"\nТекущие координаты пользователя: {current_lat:.5f}, {current_lon:.5f}\n"

    user_message = (
        f"{location_note}"
        f"Мои сохранённые места:\n" + "\n".join(lines) +
        "\n\nКуда мне лучше зайти прямо сейчас?"
    )

    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    response = requests.post(
        'https://api.polza.ai/api/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json={
            'model': 'openai/gpt-4o-mini',
            'messages': [
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_message}
            ],
            'temperature': 0.7,
            'max_tokens': 400
        },
        timeout=25
    )
    response.raise_for_status()
    ai_response = response.json()

    advice = ai_response['choices'][0]['message']['content'].strip()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'advice': advice}, ensure_ascii=False)
    }