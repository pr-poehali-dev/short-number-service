CREATE TABLE t_p25384465_short_number_service.nearby_bookmarks (
  id TEXT NOT NULL,
  user_uuid TEXT NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  distance_approx NUMERIC NOT NULL DEFAULT 0,
  address TEXT NOT NULL DEFAULT '',
  city TEXT,
  label TEXT NOT NULL DEFAULT '',
  profile TEXT NOT NULL DEFAULT '',
  hours TEXT,
  lat NUMERIC NOT NULL DEFAULT 0,
  lon NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (user_uuid, id)
);

CREATE INDEX idx_nearby_bookmarks_user ON t_p25384465_short_number_service.nearby_bookmarks(user_uuid);
CREATE INDEX idx_nearby_bookmarks_name ON t_p25384465_short_number_service.nearby_bookmarks(name);
