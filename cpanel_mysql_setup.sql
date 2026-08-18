-- =====================================================================
-- LIBERTAMEDIA.COM - CPANEL MYSQL / MARIADB DATABASE SCHEMA
-- =====================================================================
-- Salin dan jalankan skrip ini di menu phpMyAdmin cPanel Anda.

CREATE TABLE IF NOT EXISTS `articles` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT,
  `content` LONGTEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'Pemerintahan',
  `subcategory` VARCHAR(100) DEFAULT '',
  `pillar` VARCHAR(50) NOT NULL DEFAULT 'news',
  `author` JSON NOT NULL,
  `published_at` VARCHAR(100) DEFAULT 'Baru saja',
  `read_time` VARCHAR(50) DEFAULT '3 Menit Baca',
  `views` INT DEFAULT 1,
  `image` TEXT,
  `caption` TEXT,
  `tags` JSON,
  `is_editor_choice` TINYINT(1) DEFAULT 0,
  `is_hero` TINYINT(1) DEFAULT 0,
  `is_trending` TINYINT(1) DEFAULT 0,
  `trending_rank` INT DEFAULT 0,
  `audio_duration` VARCHAR(20) DEFAULT '3:00',
  `reactions` JSON,
  `ai_summary` JSON,
  `comments` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `submissions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Opini',
  `author_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) DEFAULT '-',
  `institution` VARCHAR(150) DEFAULT 'Masyarakat Umum',
  `abstract` TEXT,
  `content` LONGTEXT NOT NULL,
  `submitted_at` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `subscribers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `setting_key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pages` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

