import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

// Cesta k DB v kořeni projektu
const DB_PATH = path.join(process.cwd(), '..', 'vybaveno.db');

class DB {
  private db: sqlite3.Database;

  constructor() {
    console.log("DB: Connecting to", DB_PATH);
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) console.error("DB: Connection error", err);
      else console.log("DB: Connected successfully");
    });
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

// Singleton instance pro Next.js dev mode
const globalForDb = global as unknown as { db: DB };
export const db = globalForDb.db || new DB();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
