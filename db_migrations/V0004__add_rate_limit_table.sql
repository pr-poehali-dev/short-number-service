CREATE TABLE IF NOT EXISTS t_p25384465_short_number_service.rate_limit (
    id BIGSERIAL PRIMARY KEY,
    ip TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    requests INT NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint_window
    ON t_p25384465_short_number_service.rate_limit (ip, endpoint, window_start);
