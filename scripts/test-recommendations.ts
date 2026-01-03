import { LocalDB } from './lib/db';

async function test() {
  const db = new LocalDB();
  
  console.log("🔍 Testování doporučovacího algoritmu...\n");

  const tests = [
    { style: 'scandinavian', maxPrice: 5000, label: 'Levný skandinávský nábytek' },
    { style: 'industrial', maxPrice: 20000, label: 'Industriální kousky' },
    { material: 'solid_wood', label: 'Produkty z masivu' }
  ];

  for (const t of tests) {
    console.log(`--- ${t.label} ---`);
    let query = "SELECT name, brand, price_czk, style_tags, material FROM products WHERE 1=1";
    const params: any[] = [];

    if (t.style) {
      query += " AND style_tags LIKE ?";
      params.push(`%${t.style}%`);
    }
    if (t.material) {
      query += " AND material LIKE ?";
      params.push(`%${t.material}%`);
    }
    if (t.maxPrice) {
      query += " AND price_czk <= ?";
      params.push(t.maxPrice);
    }

    query += " LIMIT 3";
    
    // @ts-ignore - using private db for test
    const results = await new Promise((resolve) => {
      db['db'].all(query, params, (err, rows) => resolve(rows));
    }) as any[];

    results.forEach(p => {
      console.log(`- ${p.name} (${p.brand}) | ${p.price_czk} Kč | Styl: ${p.style_tags} | Mat: ${p.material}`);
    });
    console.log("\n");
  }
}

test();
