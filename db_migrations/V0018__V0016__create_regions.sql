CREATE TABLE t_p25384465_short_number_service.regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE t_p25384465_short_number_service.phone_number_regions (
  phone_number_id INT NOT NULL REFERENCES t_p25384465_short_number_service.phone_numbers(id),
  region_id INT NOT NULL REFERENCES t_p25384465_short_number_service.regions(id),
  PRIMARY KEY (phone_number_id, region_id)
);

INSERT INTO t_p25384465_short_number_service.regions (name, sort_order) VALUES
  ('Москва', 1),
  ('Санкт-Петербург', 2),
  ('Московская область', 3),
  ('Ленинградская область', 4),
  ('Краснодарский край', 5),
  ('Свердловская область', 6),
  ('Новосибирская область', 7),
  ('Татарстан', 8),
  ('Республика Башкортостан', 9),
  ('Нижегородская область', 10),
  ('Самарская область', 11),
  ('Ростовская область', 12),
  ('Челябинская область', 13),
  ('Красноярский край', 14),
  ('Омская область', 15),
  ('Пермский край', 16),
  ('Воронежская область', 17),
  ('Волгоградская область', 18),
  ('Саратовская область', 19),
  ('Тюменская область', 20);
