INSERT INTO t_p25384465_short_number_service.nearby_settings (key, value)
VALUES ('poll_interval_active', '5')
ON CONFLICT (key) DO NOTHING;

INSERT INTO t_p25384465_short_number_service.nearby_settings (key, value)
VALUES ('poll_interval_new', '30')
ON CONFLICT (key) DO NOTHING;