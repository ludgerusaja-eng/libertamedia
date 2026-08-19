import 'dotenv/config';
import mysql, { RowDataPacket } from 'mysql2/promise';

async function main() {
  for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  }
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    charset: 'utf8mb4',
  });
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM articles WHERE status='SCHEDULED' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW() LIMIT 100`
    );
    if (!rows.length) {
      console.log(JSON.stringify({ ok: true, published: 0 }));
      return;
    }
    await pool.query(
      `UPDATE articles SET status='PUBLISHED', published_at=COALESCE(published_at, NOW()) WHERE status='SCHEDULED' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()`
    );
    for (const row of rows) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata) VALUES (NULL, 'ARTICLE_AUTO_PUBLISHED', 'article', ?, ?)` ,
        [String(row.id), JSON.stringify({ reason: 'scheduled_at reached' })]
      );
    }
    console.log(JSON.stringify({ ok: true, published: rows.length }));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
});
