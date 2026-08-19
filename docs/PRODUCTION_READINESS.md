# LIBERTAMEDIA Production Readiness

This repository must pass this checklist before production launch.

## Current implementation status
The production branch now uses the MySQL-backed newsroom runtime (`server.production.ts`), persistent sessions, scrypt password hashes, RBAC, persistent rate limiting, article revisions, comments, submissions, media, settings/pages, reactions, API contract checks, and a cPanel deployment/preflight path.

## Critical security
- [x] Remove every hard-coded/default admin password and authentication bypass from runtime code.
- [x] Require production secrets through environment variables only.
- [x] Use persistent, revocable sessions; never rely on process memory for production authentication state.
- [x] Enforce role-based access control for newsroom users.
- [x] Apply rate limiting that remains effective across restarts/processes.
- [x] Validate uploaded files by MIME type, signature, size, and dimensions using Sharp decoding before storage.
- [x] Keep runtime data and production secrets out of the Git repository.
- [ ] Perform a final external security review against the deployed cPanel instance.

## Data
- [x] MySQL is the intended single source of truth in production.
- [x] Articles, revisions, users, roles, submissions, comments, media, reactions, settings, subscribers, and audit logs have tables and indexes.
- [x] Article writes and revisions use a transaction.
- [x] Pre-deploy filesystem backup is configured outside `public_html`.
- [ ] Configure a recurring off-server database backup.
- [ ] Perform and document a successful database restore test.

## Newsroom
- [x] Draft/review/fact-check/approval/scheduled/published statuses exist in the production data model.
- [x] Article revisions are retained.
- [x] Publish, edit and archive operations are audited.
- [x] Authors/editors are recorded on article revisions.
- [x] Scheduled publishing command exists: `npm run publish:scheduled`.
- [ ] Configure cPanel Cron to run `npm run publish:scheduled` every minute and verify it in production.
- [x] Citizen submissions require authenticated editorial publishing to become an article.
- [ ] Perform a full newsroom workflow test with real roles: Reporter -> Editor -> Managing Editor.

## Web platform
- [x] Health endpoint exists: `/api/health`.
- [x] HTTPS/security headers are configured at the application layer.
- [x] Images are decoded, rotated and resized before storage.
- [x] API contract check covers frontend/backend route parity.
- [ ] Validate 404/500 behavior on the deployed domain.
- [ ] Validate sitemap, news sitemap, robots.txt, RSS, canonical URLs, Open Graph, and NewsArticle schema.
- [ ] Test pagination/search with a realistic production-sized article dataset.
- [ ] Complete mobile, tablet and desktop regression testing.

## Deployment
- [x] GitHub Actions workflow contains typecheck, API contract, build and security checks.
- [x] cPanel deployment copies only intended application artifacts and never fabricates `.env`.
- [x] Production `.env` is configured manually on the server and is never committed.
- [x] cPanel Passenger startup fails fast when `dist/server.cjs` is missing or broken.
- [ ] Verify the cPanel Node.js application configuration and restart behavior on the real account.
- [ ] Apply the production MySQL schema before application cutover.
- [ ] Seed the first production SUPER_ADMIN with `npm run seed:admin`.
- [ ] Run `npm run smoke:production` against the real production database.
- [ ] Perform post-deploy health/login/content smoke tests.
- [ ] Test rollback from the backup created by `scripts/setup_cpanel.sh`.

## Launch gate

**Do not launch while any unchecked item above can cause data loss, authentication failure, broken publishing, or an unverified production deployment.**

### cPanel scheduled publishing

Configure a cPanel Cron Job to run every minute from the application directory:

```bash
cd /home/<cpanel-user>/public_html && /usr/local/bin/npm run publish:scheduled >> /home/<cpanel-user>/scheduled-publisher.log 2>&1
```

Use the Node/npm binary path provided by the cPanel Node.js environment if `/usr/local/bin/npm` differs on the hosting account.
