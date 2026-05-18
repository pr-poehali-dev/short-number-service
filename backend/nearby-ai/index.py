import json
import os
import requests


SYSTEM_PROMPT = """Ты — геолокационный помощник. Пользователь находится в конкретной точке на карте.
Твоя задача: предложить 8–12 интересных мест, которые стоит посетить прямо сейчас в радиусе 500 метров.

Важно:
- Придумывай реалистичные, разнообразные места: кафе, рестораны, магазины, аптеки, парки, достопримечательности, культурные места.
- Учитывай время суток (если известно).
- Для каждого места укажи: название, тип, краткое описание, примерное расстояние (от 30 до 500 метров), адрес (улица и номер), режим работы сегодня.

Отвечай ТОЛЬКО валидным JSON-массивом без пояснений. Формат каждого элемента:
{
  "name": "Название места",
  "type": "тип (кафе/ресторан/магазин/аптека/парк/музей/и т.д.)",
  "description": "Краткое описание",
  "distance_approx": 150,
  "address": "ул. Примерная, 10",
  "profile": "специализация или особенность",
  "hours": "09:00–22:00"
}"""


def handler(event: dict, context) -> dict:
    """
    Принимает координаты пользователя (lat, lon) и возвращает список интересных мест рядом,
    сгенерированных нейросетью через Polza.AI. Результат — тот же формат, что и 2GIS.
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
    city = body.get('city', '').strip()
    address = body.get('address', '').strip()

    if not city and not address:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Укажите город в настройках или введите адрес'}, ensure_ascii=False)
        }

    import datetime
    now = datetime.datetime.now()
    hour = now.hour
    if 6 <= hour < 12:
        time_context = "утро"
    elif 12 <= hour < 17:
        time_context = "день"
    elif 17 <= hour < 22:
        time_context = "вечер"
    else:
        time_context = "ночь"

    location_str = ""
    if city and address:
        location_str = f"в городе {city}, на улице {address}"
    elif city:
        location_str = f"в городе {city}"
    else:
        location_str = f"по адресу: {address}"

    user_message = (
        f"Я нахожусь {location_str}. "
        f"Сейчас {time_context}. "
        f"Предложи интересные места рядом (в радиусе 500 м) — кафе, рестораны, магазины, парки, культурные места и всё интересное. "
        f"В поле address указывай реальные улицы этого города."
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
            'temperature': 0.8,
            'max_tokens': 2000
        },
        timeout=25
    )
    response.raise_for_status()
    ai_response = response.json()

    raw = ai_response['choices'][0]['message']['content'].strip()

    # Убираем markdown-блок если есть
    if raw.startswith('```'):
        raw = raw.split('```')[1]
        if raw.startswith('json'):
            raw = raw[4:]
        raw = raw.strip()

    places = json.loads(raw)

    # Нормализуем поля
    result = []
    for p in places:
        result.append({
            'name': p.get('name', 'Без названия'),
            'type': p.get('type', 'место'),
            'description': p.get('description', ''),
            'distance_approx': int(p.get('distance_approx', 200)),
            'address': p.get('address', ''),
            'city': city,
            'label': p.get('type', 'место'),
            'profile': p.get('profile', ''),
            'hours': p.get('hours', ''),
        })

    result.sort(key=lambda x: x['distance_approx'])

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'places': result, 'city': city, 'address': address}, ensure_ascii=False)
    }