CREATE TABLE IF NOT EXISTS t_p25384465_short_number_service.service_availability_log (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  service_url VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL,
  http_code INTEGER,
  response_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sal_service_checked 
  ON t_p25384465_short_number_service.service_availability_log(service_name, checked_at DESC);
