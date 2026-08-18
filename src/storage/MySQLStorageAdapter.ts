import mysql from 'mysql2/promise';
import { DBStructure, IStorageAdapter } from './Repository';
import { JsonStorageAdapter } from './JsonStorageAdapter';
import { SiteSettings } from '../types';

export class MySQLStorageAdapter implements IStorageAdapter {
  private pool: mysql.Pool | null = null;
  private fallbackAdapter: JsonStorageAdapter;
  private isConnected = false;

  constructor(dataDir: string) {
    this.fallbackAdapter = new JsonStorageAdapter(dataDir);
    this.initPool();
  }

  private async initPool() {
    try {
      const host = process.env.DB_HOST || 'localhost';
      const user = process.env.DB_USER || 'libp7469_user';
      const password = process.env.DB_PASSWORD || '';
      const database = process.env.DB_NAME || 'libp7469_libertamedia';
      const port = parseInt(process.env.DB_PORT || '3306');

      if (!password && !process.env.DB_PASSWORD) {
        console.log('[MySQLStorageAdapter] MySQL DB_PASSWORD not configured. Running in JSON Fallback Mode.');
        return;
      }

      this.pool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });

      this.isConnected = true;
      console.log(`[MySQLStorageAdapter] MySQL Connection Pool initialized successfully (${user}@${host}:${port}/${database}).`);
      
      // Auto-ensure site_settings table exists
      await this.ensureTablesExist();
    } catch (err) {
      console.warn('[MySQLStorageAdapter] Failed to initialize MySQL Pool, using JSON Fallback:', err);
      this.pool = null;
      this.isConnected = false;
    }
  }

  private async ensureTablesExist() {
    if (!this.pool) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id INT PRIMARY KEY,
          data JSON,
          updated_at DATETIME
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e) {
      console.warn('[MySQLStorageAdapter] Failed to create site_settings table:', e);
    }
  }

  public readDatabase(): DBStructure {
    return this.fallbackAdapter.readDatabase();
  }

  public writeDatabase(data: DBStructure): boolean {
    const jsonSuccess = this.fallbackAdapter.writeDatabase(data);

    if (this.pool && this.isConnected) {
      this.syncToMySQL(data).catch((err) => {
        console.warn('[MySQLStorageAdapter] Async MySQL sync warning:', err.message);
      });
    }

    return jsonSuccess;
  }

  public async getSettings(): Promise<SiteSettings | null> {
    if (this.pool && this.isConnected) {
      try {
        const [rows]: any = await this.pool.query('SELECT data FROM site_settings WHERE id = 1');
        if (rows && rows.length > 0) {
          const rowData = rows[0].data;
          return typeof rowData === 'string' ? JSON.parse(rowData) : rowData;
        }
      } catch (err) {
        console.warn('[MySQLStorageAdapter] Error reading site_settings from MySQL, using JSON fallback:', err);
      }
    }
    return this.fallbackAdapter.getSettings();
  }

  public async saveSettings(settings: SiteSettings): Promise<boolean> {
    const jsonSaved = this.fallbackAdapter.saveSettings(settings);

    if (this.pool && this.isConnected) {
      try {
        await this.ensureTablesExist();
        const settingsJson = JSON.stringify(settings);
        await this.pool.query(
          `INSERT INTO site_settings (id, data, updated_at)
           VALUES (1, ?, NOW())
           ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
          [settingsJson]
        );
      } catch (err) {
        console.warn('[MySQLStorageAdapter] Error saving site_settings to MySQL:', err);
      }
    }

    return jsonSaved;
  }

  private async syncToMySQL(data: DBStructure): Promise<void> {
    if (!this.pool) return;
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const sub of data.subscribers || []) {
        await connection.query(
          'INSERT INTO subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE email = email',
          [sub]
        );
      }

      if (data.settings) {
        const settingsJson = JSON.stringify(data.settings);
        await connection.query(
          `INSERT INTO site_settings (id, data, updated_at)
           VALUES (1, ?, NOW())
           ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
          [settingsJson]
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
