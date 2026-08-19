# LIBERTAMEDIA

Production-oriented newsroom platform for libertamedia.com.

## Architecture

- React + Vite frontend
- Node.js + Express application server
- MySQL/MariaDB as the intended production source of truth
- cPanel / Phusion Passenger deployment
- GitHub as source control and deployment source

## Local development

Requirements: Node.js 22+

```bash
npm ci
cp .env.example .env
npm run dev
```

Never use production credentials locally.

## Production build

```bash
npm ci
npm run lint
npm run build
npm start
```

The build produces the browser bundle and `dist/server.cjs` for the Node/Passenger runtime.

## cPanel deployment

1. Create the MySQL/MariaDB database and user in cPanel.
2. Import `cpanel_mysql_setup.sql` into the empty production database.
3. Configure the cPanel Node.js application to use `app.js` as the startup file.
4. Create `/home/<cpanel-user>/public_html/.env` manually with production secrets.
5. Do not copy `.env.example` to `.env`.
6. Configure cPanel Git Version Control to deploy this repository and use `.cpanel.yml`.
7. Ensure Node.js 22 (or the hosting-supported compatible version) is selected.
8. Deploy and verify the Passenger restart succeeds.

The deployment script intentionally fails if production secrets or MySQL configuration are missing.

## Security rules

- Never commit `.env`, passwords, API keys, database dumps, or runtime data.
- Production authentication must never rely on hard-coded fallback credentials.
- Production must not use JSON files as the source of truth.
- Database backups must be stored outside the public web root.

## Launch gate

Read `docs/PRODUCTION_READINESS.md` before launch. The site should not be launched until all Critical Security, Data, and Deployment checks pass.
