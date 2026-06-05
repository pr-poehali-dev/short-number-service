import json
import os
import psycopg2

SCHEMA = "t_p25384465_short_number_service"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Управление закладками пользователя (anonymous UUID)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    user_uuid = params.get("uuid", "").strip()

    if not user_uuid:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "uuid required"})}

    conn = get_conn()
    cur = conn.cursor()

    # GET — загрузить все закладки пользователя
    if method == "GET":
        cur.execute(
            f"SELECT id, saved_at, name, type, description, distance_approx, address, city, label, profile, hours, lat, lon "
            f"FROM {SCHEMA}.nearby_bookmarks WHERE user_uuid = %s ORDER BY saved_at DESC",
            (user_uuid,)
        )
        rows = cur.fetchall()
        bookmarks = [
            {
                "id": r[0],
                "savedAt": r[1].isoformat(),
                "name": r[2],
                "type": r[3],
                "description": r[4],
                "distance_approx": float(r[5]),
                "address": r[6],
                "city": r[7],
                "label": r[8],
                "profile": r[9],
                "hours": r[10],
                "lat": float(r[11]),
                "lon": float(r[12]),
            }
            for r in rows
        ]
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"bookmarks": bookmarks})}

    # POST — добавить закладку
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        bm = body.get("bookmark", {})
        cur.execute(
            f"""INSERT INTO {SCHEMA}.nearby_bookmarks
                (id, user_uuid, saved_at, name, type, description, distance_approx, address, city, label, profile, hours, lat, lon)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_uuid, id) DO NOTHING""",
            (
                bm.get("id", ""),
                user_uuid,
                bm.get("savedAt"),
                bm.get("name", ""),
                bm.get("type", ""),
                bm.get("description", ""),
                bm.get("distance_approx", 0),
                bm.get("address", ""),
                bm.get("city"),
                bm.get("label", ""),
                bm.get("profile", ""),
                bm.get("hours"),
                bm.get("lat", 0),
                bm.get("lon", 0),
            )
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # DELETE — удалить закладку
    if method == "DELETE":
        body = json.loads(event.get("body") or "{}")
        bookmark_id = body.get("id", "").strip()
        if not bookmark_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
        cur.execute(
            f"DELETE FROM {SCHEMA}.nearby_bookmarks WHERE user_uuid = %s AND id = %s",
            (user_uuid, bookmark_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method not allowed"})}
