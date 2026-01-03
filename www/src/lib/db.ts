import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

// Cesta k DB v kořeni projektu
const DB_PATH = path.join(process.cwd(), '..', 'vybaveno.db');

class DB {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  async run(sql: string, params: any[] = []) {
    const run = promisify(this.db.run.bind(this.db));
    return await run(sql, params);
  }

  async get(sql: string, params: any[] = []) {
    const get = promisify(this.db.get.bind(this.db));
    return await get(sql, params);
  }

  async all(sql: string, params: any[] = []) {
    const all = promisify(this.db.all.bind(this.db));
    return await all(sql, params);
  }
}

export const db = new DB();
