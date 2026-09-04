import json
import urllib.request
import urllib.error

# Сопоставление англоязычных названий региона/города (из geo-IP сервиса)
# с русскими названиями, которые используются в справочнике
REGION_TRANSLATE = {
    "moscow": "Москва",
    "moskva": "Москва",
    "moscow oblast": "Московская область",
    "moskovskaya oblast": "Московская область",
    "saint petersburg": "Санкт-Петербург",
    "st.-petersburg": "Санкт-Петербург",
    "leningrad oblast": "Ленинградская область",
    "leningradskaya oblast": "Ленинградская область",
    "krasnodar krai": "Краснодарский край",
    "krasnodarskiy kray": "Краснодарский край",
    "sverdlovsk oblast": "Свердловская область",
    "sverdlovskaya oblast": "Свердловская область",
    "novosibirsk oblast": "Новосибирская область",
    "novosibirskaya oblast": "Новосибирская область",
    "republic of tatarstan": "Татарстан",
    "tatarstan": "Татарстан",
    "republic of bashkortostan": "Республика Башкортостан",
    "bashkortostan": "Республика Башкортостан",
    "nizhny novgorod oblast": "Нижегородская область",
    "nizhegorodskaya oblast": "Нижегородская область",
    "samara oblast": "Самарская область",
    "samarskaya oblast": "Самарская область",
    "rostov oblast": "Ростовская область",
    "rostovskaya oblast": "Ростовская область",
    "chelyabinsk oblast": "Челябинская область",
    "chelyabinskaya oblast": "Челябинская область",
    "krasnoyarsk krai": "Красноярский край",
    "krasnoyarskiy kray": "Красноярский край",
    "omsk oblast": "Омская область",
    "omskaya oblast": "Омская область",
    "perm krai": "Пермский край",
    "permskiy kray": "Пермский край",
    "voronezh oblast": "Воронежская область",
    "voronezhskaya oblast": "Воронежская область",
    "volgograd oblast": "Волгоградская область",
    "volgogradskaya oblast": "Волгоградская область",
    "saratov oblast": "Саратовская область",
    "saratovskaya oblast": "Саратовская область",
    "tyumen oblast": "Тюменская область",
    "tyumenskaya oblast": "Тюменская область",
}


def get_ip(event: dict) -> str:
    ip = (
        event.get("requestContext", {}).get("identity", {}).get("sourceIp")
        or event.get("headers", {}).get("X-Forwarded-For", "unknown").split(",")[0].strip()
    )
    return ip or "unknown"


def detect_region(ip: str):
    if not ip or ip == "unknown" or ip.startswith(("127.", "10.", "192.168.", "172.")):
        return None
    try:
        req = urllib.request.Request(f"https://ipwho.is/{ip}", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None

    if data.get("success") is False or data.get("country_code") != "RU":
        return None

    region_raw = (data.get("region") or "").strip().lower()
    city_raw = (data.get("city") or "").strip().lower()
    return REGION_TRANSLATE.get(region_raw) or REGION_TRANSLATE.get(city_raw)


def handler(event: dict, context) -> dict:
    """Определяет регион пользователя по IP-адресу для автоподстановки в фильтр справочника."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    ip = get_ip(event)
    region = detect_region(ip)

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        "body": json.dumps({"region": region}),
    }
