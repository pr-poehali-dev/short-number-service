CREATE TABLE IF NOT EXISTS t_p25384465_short_number_service.nearby_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p25384465_short_number_service.nearby_settings (key, value)
VALUES (
  'ai_prompt',
  'Ты помощник для поиска коммерческих заведений рядом с пользователем. Пользователь находится по координатам: {lat}, {lon}. Радиус поиска: 300 метров. Найди и перечисли коммерческие объекты (магазины, кафе, аптеки, банки, салоны, сервисы и т.д.) которые могут находиться в пешей доступности от этой точки. Используй свои знания о типичной городской инфраструктуре России. Ответ верни строго в формате JSON массива объектов с полями: name (название), type (тип заведения), description (короткое описание, 1-2 предложения), distance_approx (примерное расстояние в метрах, число от 50 до 300). Верни от 5 до 15 объектов. Только JSON, без пояснений.'
)
ON CONFLICT (key) DO NOTHING;
