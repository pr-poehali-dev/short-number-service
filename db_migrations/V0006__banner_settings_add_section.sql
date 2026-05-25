ALTER TABLE t_p25384465_short_number_service.banner_settings
  ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'directory';

ALTER TABLE t_p25384465_short_number_service.banner_settings
  DROP CONSTRAINT IF EXISTS banner_settings_pkey;

ALTER TABLE t_p25384465_short_number_service.banner_settings
  ADD PRIMARY KEY (key, section);

-- Перенести существующие записи на section='directory'
UPDATE t_p25384465_short_number_service.banner_settings SET section = 'directory';

-- Добавить настройки для home
INSERT INTO t_p25384465_short_number_service.banner_settings (key, value, section) VALUES
  ('enabled', 'true', 'home'),
  ('type', 'subscribe', 'home'),
  ('title', 'Полный доступ к справочнику', 'home'),
  ('text', 'Подпишитесь на новости, чтобы следить за пульсом интернет-сервиса.', 'home'),
  ('button_label', 'Подписаться', 'home'),
  ('button_url', 'https://t.me/qrnumber', 'home'),
  ('interval_hours', '24', 'home')
ON CONFLICT (key, section) DO NOTHING;

-- Добавить настройки для nearby
INSERT INTO t_p25384465_short_number_service.banner_settings (key, value, section) VALUES
  ('enabled', 'true', 'nearby'),
  ('type', 'subscribe', 'nearby'),
  ('title', 'Будьте в курсе обновлений', 'nearby'),
  ('text', 'Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы', 'nearby'),
  ('button_label', 'Подписаться', 'nearby'),
  ('button_url', 'https://t.me/qrnumber', 'nearby'),
  ('interval_hours', '24', 'nearby')
ON CONFLICT (key, section) DO NOTHING;