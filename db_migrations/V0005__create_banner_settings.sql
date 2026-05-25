CREATE TABLE t_p25384465_short_number_service.banner_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p25384465_short_number_service.banner_settings (key, value) VALUES
  ('enabled', 'true'),
  ('type', 'subscribe'),
  ('title', 'Будьте в курсе обновлений'),
  ('text', 'Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы'),
  ('button_label', 'Подписаться'),
  ('button_url', 'https://t.me/qrnumber'),
  ('interval_hours', '24')
ON CONFLICT (key) DO NOTHING;