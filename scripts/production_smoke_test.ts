import 'dotenv/config';
import { ProductionRepository } from '../src/storage/ProductionRepository';

async function main() {
  if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_SMOKE_TEST !== '1') {
    throw new Error('Refusing production smoke test outside production. Set ALLOW_SMOKE_TEST=1 for staging.');
  }
  const repo = new ProductionRepository();
  try {
    await repo.healthCheck();
    const articles = await repo.listPublishedArticles(1, 0);
    console.log(JSON.stringify({ ok: true, database: 'ok', publishedArticlesReadable: true, sampleCount: articles.length }));
  } finally {
    await repo.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
});
