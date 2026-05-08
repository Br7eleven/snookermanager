import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use a test location for the database
const dbPath = path.join(__dirname, '../cue-club.db');

console.log('Resetting database at:', dbPath);

// Remove existing database
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Existing database removed');
}

// This will trigger database creation and seeding
// We need to import and run the initialization
console.log('Database reset complete. It will be recreated on next app start.');
