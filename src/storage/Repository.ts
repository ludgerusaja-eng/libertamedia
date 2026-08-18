import { Article, CitizenSubmission, SiteSettings, StaticPage } from '../types';

export interface DBStructure {
  articles: Article[];
  submissions: CitizenSubmission[];
  subscribers: string[];
  settings?: SiteSettings;
  pages?: StaticPage[];
}

export interface IStorageAdapter {
  readDatabase(): DBStructure;
  writeDatabase(data: DBStructure): boolean;
  getSettings?(): Promise<SiteSettings | null> | SiteSettings | null;
  saveSettings?(settings: SiteSettings): Promise<boolean> | boolean;
}
