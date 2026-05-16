import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(app.getPath('userData'), 'cue-club.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('private', 'open')),
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'in_session', 'closed'))
    );

    CREATE TABLE IF NOT EXISTS game_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      rate_per_hour REAL NOT NULL DEFAULT 0,
      billing_type TEXT NOT NULL DEFAULT 'per_hour',
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      game_type_id INTEGER NOT NULL,
      player_name TEXT,
      member_id INTEGER,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      total_game_cost REAL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (table_id) REFERENCES tables(id),
      FOREIGN KEY (game_type_id) REFERENCES game_types(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS beverages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      price REAL NOT NULL,
      in_stock INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      beverage_id INTEGER NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (beverage_id) REFERENCES beverages(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('cash', 'card', 'credit')),
      discount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);

  // Migrate game_types if it still has the old name CHECK constraint
  migrateGameTypes();

  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get();
  if (staffCount.count === 0) {
    seedDatabase();
  }
}

function migrateGameTypes() {
  // Detect old schema by checking if billing_type column exists
  const cols = db.prepare("PRAGMA table_info(game_types)").all().map(c => c.name);
  if (cols.includes('billing_type')) return; // already migrated

  // Recreate game_types without name CHECK, with billing_type column
  db.exec(`
    PRAGMA foreign_keys = OFF;

    CREATE TABLE game_types_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      rate_per_hour REAL NOT NULL DEFAULT 0,
      billing_type TEXT NOT NULL DEFAULT 'per_hour',
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );

    INSERT INTO game_types_new (id, table_id, name, rate_per_hour, billing_type)
    SELECT id, table_id, name, rate_per_hour, 'per_hour' FROM game_types;

    DROP TABLE game_types;
    ALTER TABLE game_types_new RENAME TO game_types;

    PRAGMA foreign_keys = ON;
  `);

  // Century stays per_hour; Full Ball and 6 Ball become per_frame
  db.prepare("UPDATE game_types SET billing_type = 'per_frame' WHERE name IN ('Full Ball', '6 Ball')").run();

  console.log('game_types migrated: billing_type column added');
}

function seedDatabase() {
  const passwordHash = bcrypt.hashSync('admin', 10);

  db.prepare(`INSERT INTO staff (full_name, username, password_hash, role) VALUES (?, ?, ?, ?)`)
    .run('Admin User', 'admin', passwordHash, 'owner');

  const tableTypes = [
    { name: 'Private Table 1', type: 'private' },
    { name: 'Private Table 2', type: 'private' },
    { name: 'Private Table 3', type: 'private' },
    { name: 'Open Table 1', type: 'open' },
    { name: 'Open Table 2', type: 'open' },
    { name: 'Open Table 3', type: 'open' },
  ];

  const insertTable = db.prepare('INSERT INTO tables (name, type) VALUES (?, ?)');
  const insertGT = db.prepare('INSERT INTO game_types (table_id, name, rate_per_hour, billing_type) VALUES (?, ?, ?, ?)');

  tableTypes.forEach(table => {
    const { lastInsertRowid: tableId } = insertTable.run(table.name, table.type);
    insertGT.run(tableId, 'Full Ball', 150, 'per_frame');
    insertGT.run(tableId, '6 Ball', 120, 'per_frame');
    insertGT.run(tableId, 'Century', 200, 'per_hour');
  });

  const beverages = [
    { name: 'Pepsi', category: 'Soft Drink', price: 30 },
    { name: 'Green Tea', category: 'Hot Beverage', price: 25 },
    { name: 'Coffee', category: 'Hot Beverage', price: 40 },
    { name: 'Water', category: 'Soft Drink', price: 20 },
    { name: 'Chips', category: 'Snack', price: 35 },
    { name: 'Juice', category: 'Soft Drink', price: 50 },
  ];
  const insertBev = db.prepare('INSERT INTO beverages (name, category, price) VALUES (?, ?, ?)');
  beverages.forEach(b => insertBev.run(b.name, b.category, b.price));

  console.log('Database seeded successfully');
}

export function resetDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS beverages;
    DROP TABLE IF EXISTS game_types;
    DROP TABLE IF EXISTS members;
    DROP TABLE IF EXISTS tables;
    DROP TABLE IF EXISTS staff;
  `);
  initializeDatabase();
}

export default db;
