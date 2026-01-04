import { LocalDB } from './lib/db';

async function setupFTS() {
  const db = new LocalDB();
  console.log("🚀 Inicializace SQLite FTS5...");
  try {
    // 1. Vytvoření virtuální tabulky pro FTS5
    await (db as any).runAsync(`DROP TABLE IF EXISTS products_fts;`);
    await (db as any).runAsync(`
      CREATE VIRTUAL TABLE products_fts USING fts5(
        id UNINDEXED,
        name, 
        category,
        material,
        color,
        style_tags,
        search_keywords
      );
    `);
    console.log("✅ Virtuální tabulka products_fts vytvořena.");

    // 2. Naplnění FTS tabulky stávajícími daty
    await (db as any).runAsync(`
      INSERT INTO products_fts(id, name, category, material, color, style_tags, search_keywords)
      SELECT id, name, category, material, color, style_tags, search_keywords FROM products;
    `);
    console.log("✅ FTS index naplněn daty.");

    // 3. Vytvoření triggerů pro automatickou synchronizaci
    
    // Trigger po INSERT
    await (db as any).runAsync(`DROP TRIGGER IF EXISTS products_ai;`);
    await (db as any).runAsync(`
      CREATE TRIGGER products_ai AFTER INSERT ON products BEGIN
        INSERT INTO products_fts(id, name, category, material, color, style_tags, search_keywords) 
        VALUES (new.id, new.name, new.category, new.material, new.color, new.style_tags, new.search_keywords);
      END;
    `);

    // Trigger po DELETE
    await (db as any).runAsync(`DROP TRIGGER IF EXISTS products_ad;`);
    await (db as any).runAsync(`
      CREATE TRIGGER products_ad AFTER DELETE ON products BEGIN
        DELETE FROM products_fts WHERE id = old.id;
      END;
    `);

    // Trigger po UPDATE
    await (db as any).runAsync(`DROP TRIGGER IF EXISTS products_au;`);
    await (db as any).runAsync(`
      CREATE TRIGGER products_au AFTER UPDATE ON products BEGIN
        UPDATE products_fts SET
          name = new.name,
          category = new.category,
          material = new.material,
          color = new.color,
          style_tags = new.style_tags,
          search_keywords = new.search_keywords
        WHERE id = old.id;
      END;
    `);
    console.log("✅ Triggery pro synchronizaci vytvořeny.");

    // 4. Testovací dotaz
    const testResult = await db.all(`
      SELECT name, rank 
      FROM products_fts 
      WHERE products_fts MATCH 'pohovka' 
      ORDER BY rank 
      LIMIT 3
    `);
    console.log("🔍 Test vyhledávání 'pohovka':", testResult);

  } catch (error) {
    console.error("❌ Chyba při setupu FTS5:", error);
  }
}

setupFTS();
