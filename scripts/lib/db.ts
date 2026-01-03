import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'vybaveno.db');

export class LocalDB {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  async init() {
    const run = promisify(this.db.run.bind(this.db));
    
    // Create products table
    await run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        dimensions_cm TEXT, -- JSON string
        color TEXT,
        material TEXT,
        price_czk INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        affiliate_url TEXT NOT NULL,
        description_visual TEXT,
        ai_tags TEXT, -- JSON string
        ai_description TEXT,
        search_keywords TEXT, -- JSON string
        product_type TEXT DEFAULT 'furniture',
        subcategory TEXT,
        style_tags TEXT, -- JSON string
        finish TEXT,
        collection_name TEXT,
        is_seasonal INTEGER DEFAULT 0,
        season TEXT,
        availability_status TEXT,
        stock_info TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create product_images table
    await run(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        image_type TEXT DEFAULT 'gallery',
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create sessions table
    await run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        original_image_url TEXT NOT NULL,
        room_type TEXT,
        analysis_result TEXT, -- JSON string
        status TEXT DEFAULT 'uploading',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Local SQLite database initialized at:', DB_PATH);
  }

  async createSession(id: string, imageUrl: string) {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      'INSERT INTO sessions (id, original_image_url, status) VALUES (?, ?, ?)',
      [id, imageUrl, 'ready']
    );
  }

  async updateSessionAnalysis(id: string, analysis: any) {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      'UPDATE sessions SET analysis_result = ?, status = ? WHERE id = ?',
      [JSON.stringify(analysis), 'analyzed', id]
    );
  }

  async getSession(id: string) {
    const get = promisify(this.db.get.bind(this.db));
    return await get('SELECT * FROM sessions WHERE id = ?', [id]);
  }

  async upsertProduct(product: any) {
    const run = promisify(this.db.run.bind(this.db));
    
    const sql = `
      INSERT INTO products (
        id, name, brand, category, dimensions_cm, color, material, 
        price_czk, image_url, affiliate_url, description_visual,
        style_tags, collection_name, is_seasonal, season,
        availability_status, stock_info, search_keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        category=excluded.category,
        dimensions_cm=excluded.dimensions_cm,
        color=excluded.color,
        material=excluded.material,
        price_czk=excluded.price_czk,
        image_url=excluded.image_url,
        description_visual=excluded.description_visual,
        style_tags=excluded.style_tags,
        collection_name=excluded.collection_name,
        is_seasonal=excluded.is_seasonal,
        season=excluded.season,
        availability_status=excluded.availability_status,
        stock_info=excluded.stock_info,
        search_keywords=excluded.search_keywords
    `;

    await run(sql, [
      product.id,
      product.name,
      product.brand,
      product.category,
      JSON.stringify(product.dimensions_cm),
      product.color,
      product.material,
      product.price_czk,
      product.image_url,
      product.affiliate_url,
      product.description_visual,
      JSON.stringify(product.style_tags),
      product.collection_name,
      product.is_seasonal ? 1 : 0,
      product.season,
      product.availability_status,
      product.stock_info,
      JSON.stringify(product.search_keywords)
    ]);
  }

  async insertImages(productId: string, images: string[]) {
    const run = promisify(this.db.run.bind(this.db));
    for (let i = 0; i < images.length; i++) {
      await run(
        'INSERT OR IGNORE INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
        [productId, images[i], i + 1]
      );
    }
  }

  async close() {
    return new Promise<void>((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
