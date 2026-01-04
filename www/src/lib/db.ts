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
      else {
        console.log("DB: Connected successfully");
        console.log("- Local:         https://vybaveno.yrx.cz");
      }
    });
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

// Singleton instance pro Next.js dev mode
const globalForDb = global as unknown as { db: DB };
export const db = globalForDb.db || new DB();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
