/**
 * FTS Strategy - Full-text search logika
 * 
 * Wrapper pro SQLite FTS5 vyhledávání s fallback strategiemi.
 */

import { db } from '@/lib/db';
import { Product, AIRecommendation } from '../types';
import { ftsConfig } from '../fts-config';

/**
 * Vyčistí a připraví FTS dotaz s rozšířením synonym
 */
export async function cleanFTSQuery(query: string): Promise<string> {
  const words = query
    .toLowerCase()
    .replace(/[^\w\sěščřžýáíéůúďťň]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const synonymMap = await ftsConfig.getSynonyms();
  
  // Rozšíř o synonyma
  const expandedWords = new Set<string>();
  for (const word of words) {
    expandedWords.add(word);
    const synonyms = synonymMap.get(word);
    if (synonyms) {
      synonyms.forEach(s => expandedWords.add(s));
    }
  }
  
  return Array.from(expandedWords)
    .map(w => `${w}*`)
    .join(' ');
}

/**
 * Extrahuje kategorii z AI doporučení
 */
export async function getCategoryFromItem(item: string): Promise<string | null> {
  const itemLower = item.toLowerCase();
  const mappingMap = await ftsConfig.getMappings();
  
  for (const [term, category] of Array.from(mappingMap.entries())) {
    if (itemLower.includes(term)) {
      return category;
    }
  }
  return null;
}

/**
 * Vyhledá produkty pomocí FTS5 podle AI doporučení
 */
export async function searchByRecommendation(
  rec: AIRecommendation,
  budget?: number,
  limit: number = 8
): Promise<Product[]> {
  if (!rec.item) return [];
  
  const searchQuery = rec.item;
  const [cleanQuery, category] = await Promise.all([
    cleanFTSQuery(searchQuery),
    getCategoryFromItem(searchQuery)
  ]);
  
  console.log(`FTS: Searching for "${searchQuery}" -> "${cleanQuery}" (category: ${category || 'none'})`);
  
  if (!cleanQuery && !category) {
    console.log(`FTS: Empty query for "${searchQuery}"`);
    return [];
  }
  
  // 1. Nejprve zkusíme FTS vyhledávání
  let matches: any[] = [];
  
  if (cleanQuery) {
    // Pokud máme kategorii z mappingu, přidáme ji do filtrování
    let categoryFilter = '';
    let ftsParams: any[] = [cleanQuery];
    if (category) {
      categoryFilter = 'AND p.category = ?';
      ftsParams.push(category);
    }
    if (budget) ftsParams.push(budget);
    ftsParams.push(limit);
    
    const ftsQuery = `
      SELECT p.*, bm25(products_fts, 10.0, 2.0, 1.0, 1.0, 5.0, 5.0) as rank
      FROM products p
      JOIN products_fts f ON p.id = f.id
      WHERE products_fts MATCH ?
      ${categoryFilter}
      ${budget ? 'AND p.price_czk <= ?' : ''}
      ORDER BY rank
      LIMIT ?
    `;
    
    try {
      matches = await db.all(ftsQuery, ftsParams) as any[];
      console.log(`FTS: Found ${matches.length} matches for "${searchQuery}"${category ? ` in category ${category}` : ''}`);
      
      // Fallback: relaxed search (OR místo AND) - ale bez kategorie filtru, aby jsme našli víc
      if (matches.length === 0 && cleanQuery) {
        const relaxedQuery = cleanQuery.split(/\s+/).join(' OR ');
        const relaxedParams: any[] = [relaxedQuery];
        if (budget) relaxedParams.push(budget);
        relaxedParams.push(limit);
        
        console.log(`FTS: Trying relaxed query: "${relaxedQuery}"`);
        // Relaxed search bez kategorie filtru
        const relaxedFtsQuery = `
          SELECT p.*, bm25(products_fts, 10.0, 2.0, 1.0, 1.0, 5.0, 5.0) as rank
          FROM products p
          JOIN products_fts f ON p.id = f.id
          WHERE products_fts MATCH ?
          ${budget ? 'AND p.price_czk <= ?' : ''}
          ORDER BY rank
          LIMIT ?
        `;
        matches = await db.all(relaxedFtsQuery, relaxedParams) as any[];
        console.log(`FTS: Relaxed found ${matches.length} matches`);
      }
    } catch (error) {
      console.error(`FTS error for "${searchQuery}":`, error);
    }
  }
  
  // 2. Fallback/override na kategorii když máme mapping
  if (category) {
    if (matches.length === 0) {
      // Fallback: FTS nic nenašel, zkusíme kategorii
      console.log(`FTS: Fallback to category "${category}"`);
    } else {
      // Kontrola mismatch: FTS vrátil jiné kategorie
      const firstMatchCategory = matches[0].category;
      if (firstMatchCategory !== category) {
        console.log(`FTS: Detected mismatch - FTS returned ${firstMatchCategory} but expected ${category}. Using category-based search.`);
      } else {
        // FTS vrátilo správné kategorie - použijeme
        return matches.map(parseProduct);
      }
    }
    
    // Hledáme podle kategorie
    const categoryQuery = `
      SELECT p.*
      FROM products p
      WHERE p.category = ?
      ${budget ? 'AND p.price_czk <= ?' : ''}
      ORDER BY p.price_czk ASC
      LIMIT ?
    `;
    
    const categoryParams: any[] = [category];
    if (budget) categoryParams.push(budget);
    categoryParams.push(limit);
    
    try {
      const categoryMatches = await db.all(categoryQuery, categoryParams) as any[];
      console.log(`FTS: Category search found ${categoryMatches.length} matches`);
      if (categoryMatches.length > 0) {
        matches = categoryMatches;
      }
    } catch (error) {
      console.error(`Category search error:`, error);
    }
  }
  
  return matches.map(parseProduct);
}

/**
 * Vyhledá produkty pomocí FTS5 podle kontextových dotazů
 */
export async function searchByContext(
  queries: string[],
  budget?: number,
  limit: number = 20
): Promise<Product[]> {
  if (queries.length === 0) return [];
  
  const combinedQuery = queries.map(q => `"${q}"`).join(' OR ');
  
  const query = `
    SELECT p.*, bm25(products_fts, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0) as rank
    FROM products p
    JOIN products_fts f ON p.id = f.id
    WHERE products_fts MATCH ?
    ${budget ? 'AND p.price_czk <= ?' : ''}
    ORDER BY rank
    LIMIT ?
  `;
  
  const params: any[] = [combinedQuery];
  if (budget) params.push(budget);
  params.push(limit);
  
  try {
    const matches = await db.all(query, params) as any[];
    console.log(`FTS Context: Found ${matches.length} matches`);
    return matches.map(parseProduct);
  } catch (error) {
    console.error('FTS context error:', error);
    return [];
  }
}

/**
 * Parsuje DB řádek na Product objekt
 */
function parseProduct(row: any): Product {
  let dimensions: Record<string, number> = {};
  try {
    const parsed = row.dimensions_cm ? JSON.parse(row.dimensions_cm) : null;
    if (parsed && typeof parsed === 'object') {
      dimensions = parsed;
    }
  } catch {
    // Invalid JSON, use empty dimensions
  }
  
  return {
    ...row,
    style_tags: Array.isArray(row.style_tags) ? row.style_tags : (row.style_tags ? JSON.parse(row.style_tags) : []),
    width_cm: dimensions?.width || dimensions?.w || undefined,
    depth_cm: dimensions?.depth || dimensions?.d || undefined,
    height_cm: dimensions?.height || dimensions?.h || undefined,
  };
}
