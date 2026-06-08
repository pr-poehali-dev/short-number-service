INSERT INTO t_p25384465_short_number_service.phone_numbers_en (id, name, description, procedure, updated_at)
VALUES (27, 'AFI PROM', 'Industrial premises in Moscow.', 'Available from all smartphones.', NOW())
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, procedure=EXCLUDED.procedure, updated_at=NOW();
