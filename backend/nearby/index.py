import json
import os
import math
import urllib.request
import urllib.parse
import psycopg2
from rate_limit import check_rate_limit


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
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
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
            cur.execute(f"SELECT value FROM {schema}.nearby_settings WHERE key = 'city'")
            city_row = cur.fetchone()
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'prompt': row[0] if row else default, 'city': city_row[0] if city_row else ''})
            }

        if action == 'update_prompt':
            admin_token = os.environ.get('ADMIN_TOKEN', '')
            if not admin_token or event.get('headers', {}).get('X-Admin-Token', '') != admin_token:
                return {
                    'statusCode': 403,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Forbidden'})
                }
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
            new_city = body.get('city', '').strip()
            cur.execute(
                f"INSERT INTO {schema}.nearby_settings (key, value) VALUES ('city', %s) "
                f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (new_city,)
            )
            conn.commit()
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }

        BANNER_KEYS = {'enabled', 'type', 'title', 'text', 'button_label', 'button_url', 'interval_hours'}
        BANNER_SECTIONS = {'home', 'directory', 'nearby', 'faq'}
        BANNER_DEFAULTS = {
            'home':      {'enabled': 'true', 'type': 'subscribe', 'title': 'Полный доступ к справочнику', 'text': 'Подпишитесь на новости, чтобы следить за пульсом интернет-сервиса.', 'button_label': 'Подписаться', 'button_url': 'https://t.me/qrnumber', 'interval_hours': '24'},
            'directory': {'enabled': 'true', 'type': 'subscribe', 'title': 'Будьте в курсе обновлений', 'text': 'Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы', 'button_label': 'Подписаться', 'button_url': 'https://t.me/qrnumber', 'interval_hours': '24'},
            'nearby':    {'enabled': 'true', 'type': 'subscribe', 'title': 'Будьте в курсе обновлений', 'text': 'Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы', 'button_label': 'Подписаться', 'button_url': 'https://t.me/qrnumber', 'interval_hours': '24'},
            'faq':       {'enabled': 'true', 'type': 'subscribe', 'title': 'Будьте в курсе обновлений', 'text': 'Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы', 'button_label': 'Подписаться', 'button_url': 'https://t.me/qrnumber', 'interval_hours': '24'},
        }

        if action == 'get_banner':
            section = body.get('section', 'directory')
            if section not in BANNER_SECTIONS:
                section = 'directory'
            cur.execute(f"SELECT key, value FROM {schema}.banner_settings WHERE section = %s", (section,))
            rows = cur.fetchall()
            settings = dict(BANNER_DEFAULTS[section])
            for k, v in rows:
                settings[k] = v
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps(settings)
            }

        if action == 'update_banner':
            admin_token = os.environ.get('ADMIN_TOKEN', '')
            if not admin_token or event.get('headers', {}).get('X-Admin-Token', '') != admin_token:
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
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }

        if action == 'get_faq':
            lang = body.get('lang', 'ru')
            cur.execute(
                f"SELECT id, question, answer, sort_order FROM {schema}.faq_items WHERE lang = %s ORDER BY sort_order",
                (lang,)
            )
            rows = cur.fetchall()
            items = [{'id': r[0], 'q': r[1], 'a': r[2], 'sort_order': r[3]} for r in rows]
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'items': items})
            }

        if action == 'update_faq':
            admin_token = os.environ.get('ADMIN_TOKEN', '')
            if not admin_token or event.get('headers', {}).get('X-Admin-Token', '') != admin_token:
                return {
                    'statusCode': 403,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Forbidden'})
                }
            lang = body.get('lang', 'ru')
            items = body.get('items', [])
            cur.execute(f"DELETE FROM {schema}.faq_items WHERE lang = %s", (lang,))
            for i, item in enumerate(items):
                q = str(item.get('q', '')).strip()
                a = str(item.get('a', '')).strip()
                if q and a:
                    cur.execute(
                        f"INSERT INTO {schema}.faq_items (question, answer, sort_order, lang) VALUES (%s, %s, %s, %s)",
                        (q, a, i + 1, lang)
                    )
            conn.commit()
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }

        if action == 'get_numbers':
            cur.execute(
                f"SELECT id, number, name, description, operator, category, procedure, organization, device_access, industry, suggested_by "
                f"FROM {schema}.phone_numbers ORDER BY sort_order, id"
            )
            rows = cur.fetchall()
            cols = ['id','number','name','description','operator','category','procedure','organization','deviceAccess','industry','suggestedBy']
            items = [dict(zip(cols, r)) for r in rows]
            for it in items:
                for k in ['procedure','organization','deviceAccess','industry','suggestedBy']:
                    if it[k] is None:
                        del it[k]
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'numbers': items})
            }

        if action == 'save_number':
            admin_token = os.environ.get('ADMIN_TOKEN', '')
            if not admin_token or event.get('headers', {}).get('X-Admin-Token', '') != admin_token:
                return {'statusCode': 403, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Forbidden'})}
            num = body.get('number_data', {})
            nid = num.get('id')
            if nid:
                cur.execute(
                    f"UPDATE {schema}.phone_numbers SET number=%s, name=%s, description=%s, operator=%s, category=%s, procedure=%s, organization=%s, device_access=%s, industry=%s, suggested_by=%s, updated_at=NOW() WHERE id=%s",
                    (num.get('number',''), num.get('name',''), num.get('description',''), num.get('operator','Универсальный'), num.get('category',''), num.get('procedure'), num.get('organization'), num.get('deviceAccess'), num.get('industry'), num.get('suggestedBy'), nid)
                )
            else:
                cur.execute(
                    f"INSERT INTO {schema}.phone_numbers (number, name, description, operator, category, procedure, organization, device_access, industry, suggested_by, sort_order) "
                    f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {schema}.phone_numbers)) RETURNING id",
                    (num.get('number',''), num.get('name',''), num.get('description',''), num.get('operator','Универсальный'), num.get('category',''), num.get('procedure'), num.get('organization'), num.get('deviceAccess'), num.get('industry'), num.get('suggestedBy'))
                )
                nid = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True, 'id': nid})}

        if action == 'delete_number':
            admin_token = os.environ.get('ADMIN_TOKEN', '')
            if not admin_token or event.get('headers', {}).get('X-Admin-Token', '') != admin_token:
                return {'statusCode': 403, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Forbidden'})}
            nid = body.get('id')
            if nid:
                cur.execute(f"DELETE FROM {schema}.phone_numbers WHERE id = %s", (nid,))
                conn.commit()
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True})}

        lat = body.get('lat')
        lon = body.get('lon')
        address = body.get('address', '').strip()
        city_input = body.get('city', '').strip()

        api_key = os.environ['TWOGIS_API_KEY']

        # Геокодинг адреса если координаты не переданы
        if (lat is None or lon is None) and address:
            geo_query = f"{city_input} {address}".strip() if city_input else address
            geo_params = urllib.parse.urlencode({
                'key': api_key,
                'q': geo_query,
                'fields': 'items.point',
                'page_size': 1,
                'locale': 'ru_RU',
                'type': 'building,street,adm_div,poi',
            })
            geo_url = f"https://catalog.api.2gis.com/3.0/items/geocode?{geo_params}"
            geo_req = urllib.request.Request(geo_url, headers={'User-Agent': 'Mozilla/5.0'})
            try:
                with urllib.request.urlopen(geo_req, timeout=6) as geo_resp:
                    geo_raw = geo_resp.read().decode('utf-8')
                geo_data = json.loads(geo_raw)
                print(f"Geocode response: {geo_raw[:300]}")
                geo_items = geo_data.get('result', {}).get('items', [])
                point = None
                for gi in geo_items:
                    if 'point' in gi:
                        point = gi['point']
                        break
                if not point:
                    return {
                        'statusCode': 400,
                        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                        'body': json.dumps({'error': f'Адрес не найден: {geo_query}'}, ensure_ascii=False)
                    }
                lat = point['lat']
                lon = point['lon']
            except Exception as e:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': f'Ошибка геокодинга: {str(e)}'}, ensure_ascii=False)
                }

        if lat is None or lon is None:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'lat and lon are required'})
            }

        rl, remaining = check_rate_limit(event, 'nearby')
        if rl:
            return rl

        cur.execute(f"SELECT value FROM {schema}.nearby_settings WHERE key = 'search_query'")
        row = cur.fetchone()
        search_query = row[0] if row else "кафе,ресторан,магазин,аптека,банк,супермаркет"
        cur.execute(f"SELECT value FROM {schema}.nearby_settings WHERE key = 'city'")
        city_row = cur.fetchone()
        saved_city = city_row[0] if city_row else ""
        radius = 300
        fields = "items.point,items.address,items.rubrics,items.name,items.schedule"

        categories = [c.strip() for c in search_query.split(',') if c.strip()]

        items = []
        seen_ids = set()
        for cat in categories:
            params = urllib.parse.urlencode({
                'key': api_key,
                'q': cat,
                'point': f"{lon},{lat}",
                'radius': radius,
                'sort': 'distance',
                'type': 'branch',
                'fields': fields,
                'page_size': 10,
                'locale': 'ru_RU',
            })
            url = f"https://catalog.api.2gis.com/3.0/items?{params}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            try:
                with urllib.request.urlopen(req, timeout=8) as resp:
                    raw = resp.read().decode('utf-8')
                    data = json.loads(raw)
                status_code = data.get('meta', {}).get('code', '?')
                cat_items = data.get('result', {}).get('items', [])
                print(f"2GIS cat='{cat}': status={status_code}, found={len(cat_items)}")
                if status_code not in (200, '?'):
                    print(f"2GIS error body: {raw[:300]}")
                for it in cat_items:
                    iid = it.get('id', '')
                    if iid not in seen_ids:
                        seen_ids.add(iid)
                        items.append(it)
            except Exception as e:
                print(f"2GIS EXCEPTION cat='{cat}': {type(e).__name__}: {e}")

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

            # profile — дополнительные рубрики (2-я и далее), или 1-я если не совпадает с типом
            extra_rubrics = [r.get('name', '') for r in rubrics[1:] if r.get('name')]
            if extra_rubrics:
                profile = ", ".join(extra_rubrics)
            elif rubric_name and rubric_name.lower() != obj_type.lower():
                profile = rubric_name
            else:
                profile = ""

            places.append({
                'name': item.get('name', 'Без названия'),
                'type': obj_type,
                'description': f"{rubric_name}. {schedule_str}".strip('. '),
                'distance_approx': distance,
                'address': address,
                'city': saved_city,
                'label': obj_type,
                'profile': profile,
                'hours': schedule_str,
            })

        places.sort(key=lambda x: x['distance_approx'])

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'places': places[:30], 'lat': lat, 'lon': lon, 'remaining': remaining}, ensure_ascii=False)
        }

    finally:
        conn.close()