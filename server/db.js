import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'ribbontex.db');

let db;

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function initDb() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      city TEXT NOT NULL,
      area TEXT NOT NULL,
      street TEXT NOT NULL,
      value REAL NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_company TEXT DEFAULT '',
      occasion TEXT DEFAULT 'general',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS store_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      outcome TEXT NOT NULL CHECK(outcome IN ('bought', 'no_buy')),
      value REAL,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  syncAdminUser(db);
  if (userCount === 0) {
    console.log('Admin user initialized from ADMIN_USERNAME / ADMIN_PASSWORD');
  }

  const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  if (orderCount === 0) {
    seedSampleOrders(db);
  }
}

function syncAdminUser(db) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Ribbontex2026!';
  const hash = bcrypt.hashSync(password, 10);
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username);
  } else {
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  }
}

function seedSampleOrders(db) {
  const samples = [
    ['RTN-0001', '', 'Amman, Gardens', '', 25, '0797584573', '', 'birthday', 'Ribbon gift box set', 'delivered'],
    ['RTN-0002', '', 'Amman, Khalda', '', 45, '0795541791', '', 'wedding', 'Party favors — 50 pcs', 'delivered'],
    ['RTN-0003', '', 'Amman, Abdoun', '', 18, '0779552233', '', 'newborn', 'Baby shower souvenirs', 'pending'],
    ['RTN-0004', '', 'Amman, Sweifieh', '', 32, '0790123456', '', 'graduation', '', 'delivered'],
    ['RTN-0005', '', 'Zarqa, City Center', '', 22, '0788112233', '', 'general', 'Chocolate accessories', 'pending'],
  ];

  const insert = db.prepare(
    `INSERT INTO orders (order_number, city, area, street, value, customer_phone, delivery_company, occasion, notes, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))`
  );

  samples.forEach(([num, city, area, street, value, phone, courier, occasion, notes, status], i) => {
    insert.run(num, city, area, street, value, phone, courier, occasion, notes, status, samples.length - i);
  });
}
