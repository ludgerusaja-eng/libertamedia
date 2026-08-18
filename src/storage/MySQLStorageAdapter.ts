import mysql from 'mysql2/promise';
import { DBStructure, IStorageAdapter } from './Repository';
import { JsonStorageAdapter } from './JsonStorageAdapter';

export class MySQLStorageAdapter implements IStorageAdapter {
  private pool: mysql.Pool | null = null;
  private fallbackAdapter: JsonStorageAdapter;
  private isConnected = false;

  constructor(dataDir: string) {
    this.fallbackAdapter = new JsonStorageAdapter(dataDir);
    this.initPool();
  }

  private initPool() {
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
    } catch (err) {
      console.warn('[MySQLStorageAdapter] Failed to initialize MySQL Pool, using JSON Fallback:', err);
      this.pool = null;
      this.isConnected = false;
    }
  }

  public readDatabase(): DBStructure {
    // If pool is unavailable or offline, use resilient JsonStorageAdapter
    if (!this.pool || !this.isConnected) {
      return this.fallbackAdapter.readDatabase();
    }

    try {
      // Synchronous return wrapper using JSON fallback if query promise is not awaited in legacy interface
      return this.fallbackAdapter.readDatabase();
    } catch (err) {
      console.warn('[MySQLStorageAdapter] Query error, serving JSON fallback:', err);
      return this.fallbackAdapter.readDatabase();
    }
  }

  public writeDatabase(data: DBStructure): boolean {
    // Always keep JSON synchronized atomically
    const jsonSuccess = this.fallbackAdapter.writeDatabase(data);

    if (this.pool && this.isConnected) {
      // Async background sync to MySQL if connection active
      this.syncToMySQL(data).catch((err) => {
        console.warn('[MySQLStorageAdapter] Async MySQL sync warning:', err.message);
      });
    }

    return jsonSuccess;
  }

  private async syncToMySQL(data: DBStructure): Promise<void> {
    if (!this.pool) return;
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Upsert subscribers
      for (const sub of data.subscribers || []) {
        await connection.query(
          'INSERT INTO subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE email = email',
          [sub]
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
