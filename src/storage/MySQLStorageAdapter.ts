import mysql from 'mysql2/promise';
import { DBStructure, IStorageAdapter } from './Repository';
import { JsonStorageAdapter } from './JsonStorageAdapter';
import { SiteSettings } from '../types';

/** Transitional adapter. Production migration is performed by the explicit migration script.
 * Runtime routes will be migrated to query-specific MySQL repositories before this adapter
 * becomes the default production storage path. */
export class MySQLStorageAdapter implements IStorageAdapter {
  private pool: mysql.Pool | null = null;
  private fallbackAdapter: JsonStorageAdapter;
  private isConnected = false;

  constructor(dataDir: string) {
    this.fallbackAdapter = new JsonStorageAdapter(dataDir);
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;
    const port = Number(process.env.DB_PORT || 3306);
    if (!host || !user || !password || !database) {
      throw new Error('[MySQLStorageAdapter] Production MySQL configuration is incomplete.');
    }
    this.pool = mysql.createPool({ host, user, password, database, port, connectionLimit: 10, waitForConnections: true, queueLimit: 0, enableKeepAlive: true, keepAliveInitialDelay: 10000, charset: 'utf8mb4' });
    this.isConnected = true;
  }

  public readDatabase(): DBStructure {
    // Runtime migration is intentionally not silently switched here. The legacy
    // route layer is still synchronous; the production query repository will replace it.
    return this.fallbackAdapter.readDatabase();
  }

  public writeDatabase(data: DBStructure): boolean {
    // Do not claim MySQL is authoritative until all legacy routes are migrated.
    return this.fallbackAdapter.writeDatabase(data);
  }

  public async getSettings(): Promise<SiteSettings | null> {
    if (!this.pool || !this.isConnected) return this.fallbackAdapter.getSettings();
    const [rows]: any = await this.pool.query('SELECT data FROM site_settings WHERE id = 1 LIMIT 1');
    if (!rows.length) return this.fallbackAdapter.getSettings();
    const data = rows[0].data;
    return typeof data === 'string' ? JSON.parse(data) : data;
  }

  public async saveSettings(settings: SiteSettings): Promise<boolean> {
    if (!this.pool || !this.isConnected) return this.fallbackAdapter.saveSettings(settings);
    await this.pool.query(
      `INSERT INTO site_settings (id, data, updated_at) VALUES (1, ?, NOW())
       ON DUPLICATE KEY UPDATE data=VALUES(data), updated_at=NOW()`,
      [JSON.stringify(settings)]
    );
    return true;
  }

  public async healthCheck(): Promise<void> {
    if (!this.pool) throw new Error('MySQL pool unavailable');
    await this.pool.query('SELECT 1');
  }

  public async close(): Promise<void> {
    if (this.pool) await this.pool.end();
  }
}
