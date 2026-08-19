# LIBERTAMEDIA Production Readiness

This repository must pass this checklist before production launch.

## Critical security
- [ ] Remove every hard-coded/default admin password and authentication bypass from runtime code.
- [ ] Require production secrets through environment variables only.
- [ ] Use persistent, revocable sessions; never rely on process memory for production authentication state.
- [ ] Enforce role-based access control for newsroom users.
- [ ] Apply rate limiting that remains effective across restarts/processes.
- [ ] Validate uploaded files by MIME type, signature, size, and dimensions.
- [ ] Keep runtime data and uploads outside the public Git repository.

## Data
- [ ] MySQL is the single source of truth in production.
- [ ] Articles, revisions, users, roles, submissions, comments, media, settings, subscribers, and audit logs have proper tables and indexes.
- [ ] Database writes use transactions where multiple records must change together.
- [ ] Backup schedule is configured.
- [ ] At least one off-server backup exists.
- [ ] Restore procedure has been tested successfully.

## Newsroom
- [ ] Draft -> review -> fact check -> approval -> scheduled/published workflow exists.
- [ ] Article revisions are retained.
- [ ] Publish, edit, archive, and correction actions are audited.
- [ ] Authors and editors are identifiable in every revision.
- [ ] Scheduled publishing is tested.
- [ ] Citizen submissions require editorial review before publication.

## Web platform
- [ ] 404 and 500 pages work.
- [ ] Health endpoint works.
- [ ] HTTPS and security headers are enabled.
- [ ] Sitemap, news sitemap, robots.txt, RSS, canonical URLs, Open Graph, and NewsArticle schema are validated.
- [ ] Images are resized/compressed and served efficiently.
- [ ] Pagination and database indexes are tested under realistic article counts.
- [ ] Mobile, tablet, and desktop layouts are tested.

## Deployment
- [ ] GitHub Actions passes typecheck and production build.
- [ ] cPanel deploys only the intended production artifacts.
- [ ] Production `.env` is configured manually on the server and is never committed.
- [ ] Node application restart strategy is configured in cPanel.
- [ ] Database migrations are applied before application cutover.
- [ ] Health check is performed after deployment.
- [ ] Rollback procedure is documented and tested.

## Launch gate

Do not launch while any Critical Security, Data, or Deployment item is unchecked.
