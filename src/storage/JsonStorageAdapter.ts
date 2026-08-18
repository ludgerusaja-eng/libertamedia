import fs from 'fs';
import path from 'path';
import { DBStructure, IStorageAdapter } from './Repository';
import { SiteSettings } from '../types';

export const defaultSettings: SiteSettings = {
  siteName: 'LIBERTAMEDIA',
  siteTagline: 'Media Untuk Semua • Indeks Berita Publik',
  footerText: '© 2026 LIBERTAMEDIA. Seluruh hak cipta dilindungi.',
  socialLinks: { instagram: '', twitter: '', youtube: '', facebook: '' },
  sections: {
    showBreakingNews: true,
    showHeroSlider: true,
    showEditorChoice: true,
    showCitizenVoice: true,
    showNewsletter: true,
  },
  monetization: { headerBannerHtml: '', inArticleAdHtml: '', googleAnalyticsId: '' }
};

export class JsonStorageAdapter implements IStorageAdapter {
  private dataDir: string;
  private dbFile: string;
  private isWriting = false;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.dbFile = path.join(dataDir, 'db.json');
    this.initDatabase();
  }

  private initDatabase(): DBStructure {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (!fs.existsSync(this.dbFile)) {
        const initialData: DBStructure = {
          articles: [],
          submissions: [],
          subscribers: [],
          settings: defaultSettings
        };
        this.writeDatabase(initialData);
        return initialData;
      }

      const raw = fs.readFileSync(this.dbFile, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading db.json, returning safe state:', err);
      return { articles: [], submissions: [], subscribers: [], settings: defaultSettings };
    }
  }

  public readDatabase(): DBStructure {
    try {
      if (!fs.existsSync(this.dbFile)) {
        return this.initDatabase();
      }
      const raw = fs.readFileSync(this.dbFile, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Read DB error, re-initializing:', err);
      return this.initDatabase();
    }
  }

  public writeDatabase(data: DBStructure): boolean {
    const tempFile = path.join(this.dataDir, `db.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
    try {
      this.isWriting = true;
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Atomic Write Pattern: Write to temporary file, then rename atomically
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, this.dbFile);
      return true;
    } catch (err) {
      console.error('Atomic Write DB error:', err);
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch (e) {}
      }
      return false;
    } finally {
      this.isWriting = false;
    }
  }

  public getSettings(): SiteSettings {
    const db = this.readDatabase();
    return {
      ...defaultSettings,
      ...(db.settings || {}),
      sections: {
        ...defaultSettings.sections,
        ...((db.settings && db.settings.sections) || {})
      },
      socialLinks: {
        ...defaultSettings.socialLinks,
        ...((db.settings && db.settings.socialLinks) || {})
      },
      monetization: {
        ...defaultSettings.monetization,
        ...((db.settings && db.settings.monetization) || {})
      }
    };
  }

  public saveSettings(settings: SiteSettings): boolean {
    const db = this.readDatabase();
    db.settings = settings;
    return this.writeDatabase(db);
  }
}
