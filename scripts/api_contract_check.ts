import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.production.ts', import.meta.url), 'utf8');
const client = fs.readFileSync(new URL('../src/services/api.ts', import.meta.url), 'utf8');

const requiredRoutes = [
  "GET /api/health",
  "POST /api/auth/login",
  "GET /api/auth/me",
  "GET /api/articles",
  "GET /api/articles/:id",
  "POST /api/articles",
  "PUT /api/articles/:id",
  "DELETE /api/articles/:id",
  "POST /api/articles/:id/reactions",
  "POST /api/articles/:id/comments",
  "GET /api/comments",
  "PATCH /api/comments/:id",
  "GET /api/submissions",
  "POST /api/submissions",
  "POST /api/submissions/:id/publish",
  "DELETE /api/submissions/:id",
  "POST /api/newsletter",
  "GET /api/settings",
  "POST /api/settings",
  "GET /api/pages",
  "GET /api/pages/:slug",
  "POST /api/pages",
  "PUT /api/pages/:id",
  "DELETE /api/pages/:id",
  "GET /api/stats",
  "POST /api/upload",
];

for (const route of requiredRoutes) {
  const [method, path] = route.split(' ');
  const escaped = path.replaceAll('/', '\\/').replaceAll(':id', ':id').replaceAll(':slug', ':slug');
  const pattern = new RegExp(`app\\.${method.toLowerCase()}\\(\\s*['\"]${escaped}`);
  if (!pattern.test(server)) throw new Error(`Missing production route: ${route}`);
}

const requiredClientMethods = ['login', 'logout', 'getMe', 'getArticles', 'getArticleById', 'createArticle', 'updateArticle', 'deleteArticle', 'sendReaction', 'addComment', 'getSubmissions', 'submitCitizenStory', 'publishSubmission', 'deleteSubmission', 'getStats', 'subscribeNewsletter', 'uploadImage', 'getSettings', 'saveSettings', 'getPages', 'getPageBySlug', 'savePage', 'deletePage'];
for (const method of requiredClientMethods) {
  if (!new RegExp(`async\\s+${method}\\s*\\(`).test(client)) throw new Error(`Missing frontend API method: ${method}`);
}

console.log(JSON.stringify({ ok: true, routes: requiredRoutes.length, clientMethods: requiredClientMethods.length }));
