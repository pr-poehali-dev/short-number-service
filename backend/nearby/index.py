import json
import os
import psycopg2
import urllib.request


def handler(event: dict, context) -> dict:
    """
    Принимает координаты пользователя (lat, lon), берёт промпт из БД,
    отправляет запрос к OpenAI и возвращает список коммерческих объектов в радиусе 300 м.
    Поддерживает GET /prompt для получения текущего промпта и POST /prompt для его обновления.
    """
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

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    schema = os.environ.get('MAIN_DB_SCHEMA', 't_p25384465_short_number_service')

    try:
        cur = conn.cursor()

        # GET /prompt — вернуть текущий промпт
        if path.endswith('/prompt') and method == 'GET':
            cur.execute(f"SELECT value FROM {schema}.nearby_settings WHERE key = 'ai_prompt'")
            row = cur.fetchone()
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'prompt': row[0] if row else ''})
            }

        # POST /prompt — обновить промпт
        if path.endswith('/prompt') and method == 'POST':
            body = json.loads(event.get('body') or '{}')
            new_prompt = body.get('prompt', '').strip()
            if not new_prompt:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'prompt is required'})
                }
            cur.execute(
                f"INSERT INTO {schema}.nearby_settings (key, value) VALUES ('ai_prompt', %s) "
                f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (new_prompt,)
            )
            conn.commit()
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }

        # POST / — поиск объектов рядом или управление промптом через _action
        body = json.loads(event.get('body') or '{}')
        action = body.get('_action')

        if action == 'get_prompt':
            cur.execute(f"SELECT value FROM {schema}.nearby_settings WHERE key = 'ai_prompt'")
            row = cur.fetchone()
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'prompt': row[0] if row else ''})
            }

        if action == 'update_prompt':
            new_prompt = body.get('prompt', '').strip()
            if not new_prompt:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'prompt is required'})
                }
            cur.execute(
                f"INSERT INTO {schema}.nearby_settings (key, value) VALUES ('ai_prompt', %s) "
                f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (new_prompt,)
            )
            conn.commit()
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }

        lat = body.get('lat')
        lon = body.get('lon')

        if lat is None or lon is None:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'lat and lon are required'})
            }

        cur.execute(f"SELECT value FROM {schema}.nearby_settings WHERE key = 'ai_prompt'")
        row = cur.fetchone()
        prompt_template = row[0] if row else ''

        prompt = prompt_template.replace('{lat}', str(lat)).replace('{lon}', str(lon))

        api_key = os.environ.get('OPENAI_API_KEY', '')
        request_data = json.dumps({
            'model': 'gpt-4o-mini',
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': 0.7,
            'max_tokens': 2000
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

        content = ai_response['choices'][0]['message']['content'].strip()

        if content.startswith('```'):
            lines = content.split('\n')
            content = '\n'.join(lines[1:-1]) if lines[-1].strip() == '```' else '\n'.join(lines[1:])

        places = json.loads(content)

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'places': places, 'lat': lat, 'lon': lon})
        }

    finally:
        conn.close()