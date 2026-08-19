import 'dotenv/config';
import mysql from 'mysql2/promise';
import { hashPassword } from '../src/services/production-auth';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Dewan Redaksi';
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  if (password === 'CHANGE_ME' || password.length < 12) throw new Error('Set a unique ADMIN_PASSWORD with at least 12 characters');
  const pool = await mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306), charset: 'utf8mb4' });
  try {
    const passwordHash = hashPassword(password);
    await pool.query(`INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'SUPER_ADMIN', 1) ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role='SUPER_ADMIN', is_active=1`, [name, email, passwordHash]);
    console.log(`Admin seeded: ${email}`);
  } finally { await pool.end(); }
}

main().catch((error) => { console.error(error); process.exit(1); });
