/**
 * FTS Strategy - Full-text search logika
 * 
 * Wrapper pro SQLite FTS5 vyhledávání s fallback strategiemi.
 */

import { db } from '@/lib/db';
import { Product, AIRecommendation } from '../types';

/**
 * Vyčistí a připraví FTS dotaz
 */
function cleanFTSQuery(query: string): string {
  return query
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .map(w => `${w}*`)
    .join(' ');
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
  
  const searchQuery = rec.item; // Pro jednoduchost používáme item jako search query
  const cleanQuery = cleanFTSQuery(searchQuery);
  
  if (!cleanQuery) {
    console.log(`FTS: Empty query for "${searchQuery}"`);
    return [];
  }
  
  console.log(`FTS: Searching for "${searchQuery}" -> "${cleanQuery}"`);
  
  const query = `
    SELECT p.*, bm25(products_fts, 10.0, 2.0, 1.0, 1.0, 5.0, 5.0) as rank
    FROM products p
    JOIN products_fts f ON p.id = f.id
    WHERE products_fts MATCH ?
    ${budget ? 'AND p.price_czk <= ?' : ''}
    ORDER BY rank
    LIMIT ?
  `;
  
  const params: any[] = [cleanQuery];
  if (budget) params.push(budget);
  params.push(limit);
  
  try {
    let matches = await db.all(query, params) as any[];
    console.log(`FTS: Found ${matches.length} matches for "${searchQuery}"`);
    
    // Fallback: relaxed search (OR)
    if (matches.length === 0) {
      const relaxedQuery = cleanQuery.split(/\s+/).join(' OR ');
      const relaxedParams: any[] = [relaxedQuery];
      if (budget) relaxedParams.push(budget);
      relaxedParams.push(limit);
      
      console.log(`FTS: Trying relaxed query: "${relaxedQuery}"`);
      matches = await db.all(query, relaxedParams) as any[];
      console.log(`FTS: Relaxed found ${matches.length} matches`);
    }
    
    return matches.map(parseProduct);
  } catch (error) {
    console.error(`FTS error for "${searchQuery}":`, error);
    return [];
  }
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
  return {
    ...row,
    style_tags: row.style_tags ? JSON.parse(row.style_tags) : [],
  };
}
