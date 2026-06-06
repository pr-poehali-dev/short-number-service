"""
Возвращает время деплоя функции (фиксируется при старте контейнера).
"""

import json
from datetime import datetime, timezone, timedelta

MSK = timezone(timedelta(hours=3))
DEPLOY_TIME = datetime.now(tz=MSK).strftime("%d.%m.%Y, %H:%M")


def handler(event: dict, context) -> dict:
    cors = {"Access-Control-Allow-Origin": "*"}

    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {**cors, "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"},
            "body": "",
        }

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({"build_time": DEPLOY_TIME}),
    }
