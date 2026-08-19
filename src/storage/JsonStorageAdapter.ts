import fs from 'fs';
import path from 'path';
import { DBStructure, IStorageAdapter } from './Repository';
import { SiteSettings } from '../types';

export const defaultSettings: SiteSettings = {
  siteName: 'LIBERTAMEDIA',
  siteTagline: 'Media Untuk Semua • Indeks Berita Publik',
  footerText: '© 2026 LIBERTAMEDIA. Seluruh hak cipta dilindungi.',
  socialLinks: { instagram: '', twitter: '', youtube: '', facebook: '' },
  sections: { showBreakingNews: true, showHeroSlider: true, showEditorChoice: true, showCitizenVoice: true, showNewsletter: true },
  monetization: { headerBannerHtml: '', inArticleAdHtml: '', googleAnalyticsId: '' }
};

/** Development-only adapter. Production must use MySQL. */
export class JsonStorageAdapter implements IStorageAdapter {
  private dbFile: string;

  constructor(dataDir: string) {
    this.dbFile = path.join(dataDir, 'db.json');
    fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(this.dbFile)) {
      this.writeDatabaseSync({ articles: [], submissions: [], subscribers: [], settings: defaultSettings });
    }
  }

  public async readDatabase(): Promise<DBStructure> {
    try {
      return JSON.parse(await fs.promises.readFile(this.dbFile, 'utf-8'));
    } catch (error) {
      throw new Error(`Unable to read development database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async writeDatabase(data: DBStructure): Promise<boolean> {
    const tempFile = `${this.dbFile}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.promises.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      await fs.promises.rename(tempFile, this.dbFile);
      return true;
    } catch (error) {
      try { await fs.promises.unlink(tempFile); } catch {}
      throw error;
    }
  }

  public async getSettings(): Promise<SiteSettings> {
    const db = await this.readDatabase();
    return {
      ...defaultSettings,
      ...(db.settings || {}),
      sections: { ...defaultSettings.sections, ...(db.settings?.sections || {}) },
      socialLinks: { ...defaultSettings.socialLinks, ...(db.settings?.socialLinks || {}) },
      monetization: { ...defaultSettings.monetization, ...(db.settings?.monetization || {}) }
    };
  }

  public async saveSettings(settings: SiteSettings): Promise<boolean> {
    const db = await this.readDatabase();
    db.settings = settings;
    return this.writeDatabase(db);
  }

  private writeDatabaseSync(data: DBStructure): void {
    fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}
