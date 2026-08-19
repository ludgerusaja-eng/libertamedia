import { Article, CitizenSubmission, SiteSettings, StaticPage } from '../types';

export interface DBStructure {
  articles: Article[];
  submissions: CitizenSubmission[];
  subscribers: string[];
  settings?: SiteSettings;
  pages?: StaticPage[];
}

/**
 * Storage adapters are asynchronous because production persistence is a
 * network database. Keeping this contract async prevents accidental blocking
 * file-style APIs from leaking into the production runtime.
 */
export interface IStorageAdapter {
  readDatabase(): Promise<DBStructure>;
  writeDatabase(data: DBStructure): Promise<boolean>;
  getSettings?(): Promise<SiteSettings | null>;
  saveSettings?(settings: SiteSettings): Promise<boolean>;
}
