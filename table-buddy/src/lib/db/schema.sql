CREATE TABLE IF NOT EXISTS call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  call_id TEXT NOT NULL,
  reservation_id INTEGER,
  customer_phone TEXT NOT NULL,
  call_date DATE NOT NULL,
  call_time TIME NOT NULL,
  call_duration INTEGER NOT NULL, -- Duration in seconds
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
); 