import json
import os
import urllib.request


SYSTEM_PROMPT = """Ты — персональный помощник по выбору мест для посещения. 
Пользователь сохранил список мест в шаговой доступности. 
Проанализируй их и дай конкретную рекомендацию: куда лучше всего зайти сегодня с точки зрения экономии времени и денег.
Учитывай: расстояние (чем ближе — тем лучше), тип заведения, время работы, описание.
Отвечай по-русски, в стиле дружеского совета. 
Формат ответа: начни с "Лучше всего зайти в..." и объясни почему (2-4 предложения).
Если закладок мало или они однотипны — всё равно дай лучший совет из доступного.
Не используй списки и заголовки — только живой текст."""


def handler(event: dict, context) -> dict:
    """
    Принимает список закладок пользователя, отправляет их в GPT и возвращает
    персональную рекомендацию по выбору места с точки зрения выгоды и экономии.
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
        if bm.get('distance_approx'):
            parts.append(f"расстояние: ~{bm['distance_approx']} м")
        if bm.get('description'):
            parts.append(f"описание: {bm['description']}")
        lines.append(', '.join(parts))

    user_message = "Мои сохранённые места:\n" + "\n".join(lines) + "\n\nКуда мне лучше зайти сегодня?"

    api_key = os.environ.get('OPENAI_API_KEY', '')
    request_data = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': user_message}
        ],
        'temperature': 0.7,
        'max_tokens': 400
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=request_data,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=25) as resp:
        ai_response = json.loads(resp.read().decode('utf-8'))

    advice = ai_response['choices'][0]['message']['content'].strip()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'advice': advice}, ensure_ascii=False)
    }
