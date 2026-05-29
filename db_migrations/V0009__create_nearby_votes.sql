CREATE TABLE t_p25384465_short_number_service.nearby_votes (
    id SERIAL PRIMARY KEY,
    comment TEXT,
    ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);