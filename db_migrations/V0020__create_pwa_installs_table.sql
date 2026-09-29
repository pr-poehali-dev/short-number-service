CREATE TABLE IF NOT EXISTS t_p25384465_short_number_service.pwa_installs (
    id SERIAL PRIMARY KEY,
    platform TEXT,
    user_agent TEXT,
    ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwa_installs_created_at ON t_p25384465_short_number_service.pwa_installs (created_at);