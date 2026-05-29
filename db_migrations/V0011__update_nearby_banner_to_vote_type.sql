UPDATE t_p25384465_short_number_service.banner_settings
SET value = 'vote', updated_at = NOW()
WHERE section = 'nearby' AND key = 'type';

UPDATE t_p25384465_short_number_service.banner_settings
SET value = 'Найти рядом — проголосуйте за запуск', updated_at = NOW()
WHERE section = 'nearby' AND key = 'title';

UPDATE t_p25384465_short_number_service.banner_settings
SET value = 'Поиск мест рядом работает через коммерческий API 2ГИС. Поддержите запуск голосом — и мы откроем доступ первым участникам.', updated_at = NOW()
WHERE section = 'nearby' AND key = 'text';

UPDATE t_p25384465_short_number_service.banner_settings
SET value = '0', updated_at = NOW()
WHERE section = 'nearby' AND key = 'interval_hours';