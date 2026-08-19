-- Production schema sanity checks. Execute after cpanel_mysql_setup.sql.
SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (
  'users','sessions','articles','article_revisions','tags','article_tags','comments','media','submissions','subscribers','site_settings','pages','audit_logs','rate_limits','article_reactions'
) ORDER BY table_name;

SELECT COUNT(*) AS users_count FROM users;
SELECT COUNT(*) AS articles_count FROM articles;
SELECT COUNT(*) AS published_articles FROM articles WHERE status='PUBLISHED';
SELECT COUNT(*) AS active_sessions FROM sessions WHERE revoked_at IS NULL AND expires_at > NOW();
