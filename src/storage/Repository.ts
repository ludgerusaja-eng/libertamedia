import { Article, CitizenSubmission } from '../types';

export interface DBStructure {
  articles: Article[];
  submissions: CitizenSubmission[];
  subscribers: string[];
}

export interface IStorageAdapter {
  readDatabase(): DBStructure;
  writeDatabase(data: DBStructure): boolean;
}
