INSERT INTO t_p25384465_short_number_service.phone_number_regions (phone_number_id, region_id)
VALUES (27, 1);

INSERT INTO t_p25384465_short_number_service.phone_numbers
  (number, name, description, operator, category, organization, industry, device_access, procedure, sort_order)
VALUES
  ('*7744', 'Петербургский метрополитен', 'Справочная служба метрополитена Санкт-Петербурга. Информация о маршрутах, расписании и утерянных вещах.',
   'Универсальный', 'Коммерческие', 'ГУП «Петербургский метрополитен»', 'Транспорт', 'mobile',
   'Доступен со всех смартфонов бесплатно.',
   (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM t_p25384465_short_number_service.phone_numbers));

INSERT INTO t_p25384465_short_number_service.phone_number_regions (phone_number_id, region_id)
SELECT p.id, r.id
FROM t_p25384465_short_number_service.phone_numbers p, t_p25384465_short_number_service.regions r
WHERE p.number = '*7744' AND r.name IN ('Санкт-Петербург', 'Ленинградская область');
