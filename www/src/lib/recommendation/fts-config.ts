/**
 * FTS Config Service
 * 
 * Správa dynamických pravidel pro Full-text search z databáze.
 * Zajišťuje caching pro minimalizaci DB dotazů při každém vyhledávání.
 */

import { db } from '@/lib/db';

class FTSConfigService {
  private cache: { 
    mappings: Map<string, string>; 
    synonyms: Map<string, string[]>;
  } | null = null;
  
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minut

  /**
   * Získá mapování termínů na kategorie
   */
  async getMappings(): Promise<Map<string, string>> {
    await this.ensureCache();
    return this.cache!.mappings;
  }

  /**
   * Získá synonyma pro rozšíření dotazu
   */
  async getSynonyms(): Promise<Map<string, string[]>> {
    await this.ensureCache();
    return this.cache!.synonyms;
  }

  /**
   * Invaliduje cache a vynutí znovunačtení z DB
   */
  async refreshCache(): Promise<void> {
    console.log('FTSConfig: Refreshing cache from DB...');
    try {
      const [mappings, synonyms] = await Promise.all([
        db.all('SELECT term, category FROM fts_term_mappings WHERE is_active = 1'),
        db.all('SELECT source_term, synonym FROM fts_synonyms WHERE is_active = 1')
      ]);
      
      this.cache = {
        mappings: new Map(mappings.map(m => [m.term.toLowerCase(), m.category])),
        synonyms: this.groupSynonyms(synonyms)
      };
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      console.log(`FTSConfig: Loaded ${mappings.length} mappings and ${this.cache.synonyms.size} synonym groups`);
    } catch (error) {
      console.error('FTSConfig: Failed to refresh cache', error);
      // Fallback na prázdnou cache, aby aplikace nespadla
      this.cache = { mappings: new Map(), synonyms: new Map() };
    }
  }

  private async ensureCache(): Promise<void> {
    if (!this.cache || Date.now() > this.cacheExpiry) {
      await this.refreshCache();
    }
  }

  private groupSynonyms(rows: any[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const row of rows) {
      const source = row.source_term.toLowerCase();
      if (!groups.has(source)) {
        groups.set(source, []);
      }
      groups.get(source)!.push(row.synonym.toLowerCase());
    }
    return groups;
  }
}

// Singleton instance
export const ftsConfig = new FTSConfigService();
