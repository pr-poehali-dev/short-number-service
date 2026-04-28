import json
import os
import math
import urllib.request
import urllib.parse
import psycopg2


def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return int(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


RUBRIC_TO_TYPE = {
    "Еда": "ресторан",
    "Кафе": "кафе",
    "Ресторан": "ресторан",
    "Кофейня": "кафе",
    "Магазин": "магазин",
    "Супермаркет": "супермаркет",
    "Аптека": "аптека",
    "Банк": "банк",
    "Банкомат": "банкомат",
    "Медицина": "клиника",
    "Больница": "больница",
    "Стоматология": "стоматология",
    "Фитнес": "фитнес",
    "Спорт": "спортзал",
    "Заправка": "заправка",
    "Автосервис": "автосервис",
    "Прачечная": "прачечная",
    "Химчистка": "химчистка",
    "Цветы": "цветы",
    "Ювелирный": "ювелирный",
    "Оптика": "оптика",
    "Почта": "почта",
    "Парикмахерская": "парикмахерская",
    "Салон красоты": "салон",
}


def rubric_to_type(rubrics: list) -> str:
    for r in rubrics:
        name = r.get("name", "")
        for key, val in RUBRIC_TO_TYPE.items():
            if key.lower() in name.lower():
                return val
    if rubrics:
        return rubrics[0].get("name", "место")
    return "место"


def handler(event: dict, context) -> dict:
    """
    Принимает координаты пользователя (lat, lon), ищет объекты в радиусе 500м
    через 2GIS Places API и возвращает список мест с расстоянием, адресом и типом.
    Поддерживает управление промптом через _action (совместимость с фронтендом).
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

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    schema = os.environ.get('MAIN_DB_SCHEMA', 't_p25384465_short_number_service')

    try:
        cur = conn.cursor()
        body = json.loads(event.get('body') or '{}')
        action = body.get('_action')

        if action == 'get_prompt':
            cur.execute(f"SELECT value FROM {schema}.nearby_settings WHERE key = 'search_query'")
            row = cur.fetchone()
            default = "кафе,ресторан,магазин,аптека,банк,супермаркет"
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'prompt': row[0] if row else default})
            }

        if action == 'update_prompt':
            new_val = body.get('prompt', '').strip()
            if not new_val:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'value is required'})
                }
            cur.execute(
                f"INSERT INTO {schema}.nearby_settings (key, value) VALUES ('search_query', %s) "
                f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (new_val,)
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

        cur.execute(f"SELECT value FROM {schema}.nearby_settings WHERE key = 'search_query'")
        row = cur.fetchone()
        search_query = row[0] if row else "кафе,ресторан,магазин,аптека,банк,супермаркет"

        api_key = os.environ['TWOGIS_API_KEY']
        radius = 500
        fields = "items.point,items.address,items.rubrics,items.name,items.schedule"

        categories = [c.strip() for c in search_query.split(',') if c.strip()]

        seen_names = set()
        items = []

        for category in categories:
            params = urllib.parse.urlencode({
                'key': api_key,
                'q': category,
                'point': f"{lon},{lat}",
                'radius': radius,
                'type': 'branch',
                'fields': fields,
                'page_size': 5,
                'locale': 'ru_RU',
            })
            url = f"https://catalog.api.2gis.com/3.0/items?{params}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                for item in data.get('result', {}).get('items', []):
                    name = item.get('name', '')
                    if name not in seen_names:
                        seen_names.add(name)
                        items.append(item)
            except Exception as e:
                print(f"2GIS error for '{category}': {e}")

        places = []
        for item in items:
            point = item.get('point', {})
            item_lat = point.get('lat')
            item_lon = point.get('lon')

            if item_lat is None or item_lon is None:
                continue

            distance = haversine(lat, lon, item_lat, item_lon)

            rubrics = item.get('rubrics', [])
            obj_type = rubric_to_type(rubrics)

            address_obj = item.get('address', {})
            address = address_obj.get('name', '')

            schedule = item.get('schedule', {})
            schedule_str = ""
            if schedule:
                today_keys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                import datetime
                weekday = datetime.datetime.now().weekday()
                today_key = today_keys[weekday]
                today_hours = schedule.get(today_key, {}).get('working_hours', [])
                if today_hours:
                    h = today_hours[0]
                    schedule_str = f"Сегодня: {h.get('from', '')}–{h.get('to', '')}"

            rubric_name = rubrics[0].get('name', '') if rubrics else ''

            places.append({
                'name': item.get('name', 'Без названия'),
                'type': obj_type,
                'description': f"{rubric_name}. {schedule_str}".strip('. '),
                'distance_approx': distance,
                'address': address,
                'label': obj_type,
                'profile': rubric_name,
            })

        places.sort(key=lambda x: x['distance_approx'])

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'places': places[:30], 'lat': lat, 'lon': lon}, ensure_ascii=False)
        }

    finally:
        conn.close()