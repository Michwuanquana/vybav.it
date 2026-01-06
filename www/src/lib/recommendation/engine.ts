/**
 * Recommendation Engine - Hlavní orchestrace doporučovacího systému
 * 
 * Centralizovaná logika pro výběr produktů s podporou:
 * - FTS5 full-text search
 * - Stylové shody
 * - Cenového filtrování
 * - Inteligentních bomb (upsell)
 * - Prioritizace podle zaplněnosti místnosti
 */

import { 
  Product, 
  RecommendationConfig, 
  RecommendationResult,
  ProductScore 
} from './types';
import { 
  filterByBudget, 
  identifyBombs, 
  calculateBombThreshold,
  getDefaultBombConfig 
} from './strategies/budget';
import { 
  calculateStyleScore, 
  calculateRecommendationScore,
  getRelevantStyles,
  getRelevantCategories 
} from './strategies/style';
import { 
  calculateFurnishingScore,
  prioritizeRecommendationsBySize 
} from './strategies/furnishing';
import { 
  searchByRecommendation,
  searchByContext 
} from './strategies/fts';

/**
 * Hlavní funkce pro získání doporučených produktů
 * 
 * @param allProducts - Volitelný seznam přednačtených produktů
 * @param config - Konfigurační parametry
 * @returns Seřazené produkty + bomby
 */
export async function getRecommendations(
  allProducts: Product[] | null,
  config: RecommendationConfig
): Promise<RecommendationResult> {
  const {
    style,
    room,
    budget,
    recommendations = [],
    contextual_queries = [],
    furnishing_level = 50,
    limit = 50,
    includeNearBudget = false,
    enableBombs = true,
    maxBombs
  } = config;

  let candidateProducts = allProducts || [];
  
  // 0. FILTROVÁNÍ podle typu místnosti (pokud je zadán a není AI mód a máme produkty)
  if (room && recommendations.length === 0 && candidateProducts.length > 0) {
    const relevantCategories = getRelevantCategories(room);
    const categorySet = new Set(relevantCategories.map(c => c.toLowerCase()));
    candidateProducts = candidateProducts.filter(p => 
      p.category && categorySet.has(p.category.toLowerCase())
    );
  }
  
  // 1. FTS VYHLEDÁVÁNÍ (pokud jsou AI doporučení) - Toto je preferovaná cesta
  if (recommendations.length > 0) {
    const ftsResults: Product[] = [];
    const seenIds = new Set<string>();
    
    // FTS podle AI markers - PARALELNĚ
    const matchesArray = await Promise.all(recommendations.map(rec => searchByRecommendation(rec, budget)));
    matchesArray.forEach(matches => {
      matches.forEach(p => {
        if (!seenIds.has(p.id)) {
          ftsResults.push(p);
          seenIds.add(p.id);
        }
      });
    });
    
    // FTS podle kontextových dotazů
    if (contextual_queries.length > 0 && ftsResults.length < limit) {
      const contextMatches = await searchByContext(contextual_queries, budget, limit - ftsResults.length);
      contextMatches.forEach(p => {
        if (!seenIds.has(p.id)) {
          ftsResults.push(p);
          seenIds.add(p.id);
        }
      });
    }
    
    // Pokud FTS vrátilo výsledky, použijeme JE jako exkluzivní kandidáty
    if (ftsResults.length > 0) {
      candidateProducts = ftsResults;
      console.log(`Engine: AI mode - using ${ftsResults.length} FTS matches as exclusive candidates`);
    } else if (candidateProducts.length === 0) {
      console.warn(`Engine: AI mode - FTS found ZERO matches and no candidates provided`);
    }
  }

  // 2. FILTROVÁNÍ podle rozpočtu
  const withinBudget = filterByBudget(candidateProducts, budget, includeNearBudget);
  
  // 3. SKÓROVÁNÍ každého produktu
  const scoredProducts: ProductScore[] = withinBudget.map(product => {
    let score = 0;
    const reasons: string[] = [];
    
    // A) Stylová shoda (0-100 bodů)
    if (style) {
      const styleScore = calculateStyleScore(product, style);
      score += styleScore;
      if (styleScore > 0) {
        reasons.push(`Styl: ${styleScore}/100`);
      }
    } else if (room) {
      // Fallback: relevantní styly pro typ místnosti
      const relevantStyles = getRelevantStyles(room);
      const scores = relevantStyles.map(s => calculateStyleScore(product, s));
      const maxStyleScore = scores.length > 0 ? Math.max(...scores) : 0;
      score += maxStyleScore * 0.7; 
      if (maxStyleScore > 0) {
        reasons.push(`Místnost: ${Math.round(maxStyleScore * 0.7)}/70`);
      }
    }
    
    // B) AI doporučení (0-100 bodů)
    if (recommendations.length > 0) {
      const recScore = calculateRecommendationScore(product, recommendations);
      score += recScore;
      if (recScore > 0) {
        reasons.push(`AI shoda: ${Math.round(recScore)}/100`);
      }
    }
    
    // C) Zaplněnost místnosti (0-30 bodů)
    const furnishingScore = calculateFurnishingScore(product, furnishing_level);
    score += furnishingScore;
    if (furnishingScore > 10) {
      reasons.push(`Velikost: +${furnishingScore}`);
    }
    
    // D) Cenová atraktivita
    const priceRatio = 1 - (product.price_czk / budget);
    const priceBonus = Math.max(0, priceRatio * 10); 
    score += priceBonus;
    
    return {
      product,
      score,
      reasons
    };
  });
  
  // 4. SEŘAZENÍ podle skóre (sestupně)
  scoredProducts.sort((a, b) => b.score - a.score);
  
  // 5. VÝBĚR TOP N produktů
  const topProducts = scoredProducts.slice(0, limit).map(sp => sp.product);
  
  // 6. BOMBY (upsell) - pouze pokud je povoleno
  let bombs: Product[] = [];
  const bombThreshold = calculateBombThreshold(budget);
  
  if (enableBombs) {
    const bombConfig = getDefaultBombConfig(budget);
    const finalMaxBombs = maxBombs !== undefined ? maxBombs : bombConfig.maxCount;
    
    // Vytvoříme score mapu pro lepší výběr bomb
    const scoreMap = new Map<string, number>();
    scoredProducts.forEach(sp => scoreMap.set(sp.product.id, sp.score));
    
    // Pokud máme allProducts, použijeme je, jinak zkusíme kandidáty
    const bombPool = (allProducts && allProducts.length > 0) ? allProducts : candidateProducts;
    bombs = identifyBombs(bombPool, budget, finalMaxBombs, scoreMap);
  }
  
  return {
    products: topProducts,
    bombs,
    total: topProducts.length + bombs.length,
    config,
    debug: {
      scoredProducts: scoredProducts.slice(0, 20),
      bombThreshold
    }
  };
}

/**
 * Helper pro rychlé doporučení bez AI kontextu (Discovery Mode)
 */
export async function getDiscoveryRecommendations(
  allProducts: Product[] | null,
  room: string,
  budget: number,
  limit: number = 50
): Promise<RecommendationResult> {
  return getRecommendations(allProducts, {
    room,
    budget,
    limit,
    enableBombs: false 
  });
}

/**
 * Helper pro doporučení s AI kontextem (po analýze)
 */
export async function getAIRecommendations(
  allProducts: Product[] | null,
  config: RecommendationConfig
): Promise<RecommendationResult> {
  // Prioritizujeme AI doporučení podle velikosti
  if (config.recommendations && config.furnishing_level !== undefined) {
    config.recommendations = prioritizeRecommendationsBySize(
      config.recommendations,
      config.furnishing_level
    );
  }
  
  return getRecommendations(allProducts, {
    ...config,
    enableBombs: true, 
    includeNearBudget: true 
  });
}
