import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database | null = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: './restaurants.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS restaurant_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS operating_hours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day TEXT NOT NULL,
        lunch_opening_time TEXT NOT NULL,
        lunch_closing_time TEXT NOT NULL,
        dinner_opening_time TEXT NOT NULL,
        dinner_closing_time TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(day)
      );

      CREATE TABLE IF NOT EXISTS table_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        turnaround_time INTEGER NOT NULL DEFAULT 90,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        section TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        attributes TEXT,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'reserved')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT NOT NULL,
        party_size INTEGER NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('confirmed', 'cancelled', 'completed','pending')),
        occasion TEXT,
        special_requests TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tables(id)
      );

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

      CREATE TRIGGER IF NOT EXISTS update_restaurant_settings_timestamp 
      AFTER UPDATE ON restaurant_settings
      BEGIN
        UPDATE restaurant_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_operating_hours_timestamp 
      AFTER UPDATE ON operating_hours
      BEGIN
        UPDATE operating_hours SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_table_settings_timestamp 
      AFTER UPDATE ON table_settings
      BEGIN
        UPDATE table_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_tables_timestamp 
      AFTER UPDATE ON tables
      BEGIN
        UPDATE tables SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_reservations_timestamp 
      AFTER UPDATE ON reservations
      BEGIN
        UPDATE reservations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    // Insert default operating hours
    const defaultHours = [
      { day: 'monday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
      { day: 'tuesday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
      { day: 'wednesday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
      { day: 'thursday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
      { day: 'friday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
      { day: 'saturday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' },
      { day: 'sunday', lunch_opening_time: '11:30', lunch_closing_time: '14:30', dinner_opening_time: '17:00', dinner_closing_time: '22:00' }
    ];

    for (const hours of defaultHours) {
      await db.run(`
        INSERT OR IGNORE INTO operating_hours (
          day,
          lunch_opening_time,
          lunch_closing_time,
          dinner_opening_time,
          dinner_closing_time
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        hours.day,
        hours.lunch_opening_time,
        hours.lunch_closing_time,
        hours.dinner_opening_time,
        hours.dinner_closing_time
      ]);
    }
  }

  return db;
}