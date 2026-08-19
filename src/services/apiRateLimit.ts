import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

export class PersistentRateLimiter {
  private readonly pool: mysql.Pool;
  constructor() {
    for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
      if (!process.env[key]) throw new Error(`[PersistentRateLimiter] Missing ${key}`);
    }
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      connectionLimit: 5,
      waitForConnections: true,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
  }

  async consume(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    const normalizedKey = crypto.createHash('sha256').update(key).digest('hex');
    const now = new Date();
    const expiresAt = new Date(Date.now() + windowSeconds * 1000);
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<any[]>(
        `SELECT id, request_count, expires_at FROM rate_limits WHERE rate_key = ? FOR UPDATE`,
        [normalizedKey]
      );
      if (!rows.length || new Date(rows[0].expires_at).getTime() <= Date.now()) {
        await connection.query(
          `INSERT INTO rate_limits (rate_key, request_count, expires_at, updated_at)
           VALUES (?, 1, ?, ?)
           ON DUPLICATE KEY UPDATE request_count=1, expires_at=VALUES(expires_at), updated_at=VALUES(updated_at)`,
          [normalizedKey, expiresAt, now]
        );
        await connection.commit();
        return true;
      }
      if (Number(rows[0].request_count) >= maxRequests) {
        await connection.rollback();
        return false;
      }
      await connection.query(
        `UPDATE rate_limits SET request_count = request_count + 1, updated_at = ? WHERE id = ?`,
        [now, rows[0].id]
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async close(): Promise<void> { await this.pool.end(); }
}
