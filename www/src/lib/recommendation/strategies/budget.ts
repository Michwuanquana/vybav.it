/**
 * Budget Strategy - Cenová logika a dynamické bomby
 * 
 * Inteligentní filtrování produktů podle rozpočtu s upsell "bombami"
 * podle cenového pásma uživatele.
 */

import { Product, BombConfig, PriceTier } from '../types';

/**
 * Určí cenové pásmo uživatele na základě rozpočtu
 */
export function getPriceTier(budget: number): PriceTier {
  if (budget < 20000) return 'budget';
  if (budget < 60000) return 'mid';
  return 'premium';
}

/**
 * Vypočítá bomb threshold podle cenového pásma
 * 
 * @example
 * Budget user (15k) -> bomba +10-15% = 16.5k-17.3k
 * Mid user (40k) -> bomba +10-20% = 44k-48k
 * Premium user (80k) -> bomba +15-25% = 92k-100k
 */
export function calculateBombThreshold(budget: number): { min: number; max: number } {
  const tier = getPriceTier(budget);
  
  switch (tier) {
    case 'budget':
      return {
        min: budget * 1.10,  // +10%
        max: budget * 1.15   // +15%
      };
    case 'mid':
      return {
        min: budget * 1.10,  // +10%
        max: budget * 1.20   // +20%
      };
    case 'premium':
      return {
        min: budget * 1.15,  // +15%
        max: budget * 1.25   // +25%
      };
  }
}

/**
 * Defaultní bomb konfigurace podle cenového pásma
 */
export function getDefaultBombConfig(budget: number): BombConfig {
  const threshold = calculateBombThreshold(budget);
  const tier = getPriceTier(budget);
  
  return {
    minPercentage: tier === 'budget' ? 10 : tier === 'mid' ? 10 : 15,
    maxPercentage: tier === 'budget' ? 15 : tier === 'mid' ? 20 : 25,
    maxCount: tier === 'budget' ? 1 : 2  // Budget: 1 bomba, zbytek: 2
  };
}

/**
 * Filtruje produkty podle rozpočtu
 * 
 * @param products - Všechny dostupné produkty
 * @param budget - Max rozpočet uživatele (musí být > 0)
 * @param includeNearBudget - Povolit produkty lehce nad rozpočtem (až +15%)
 */
export function filterByBudget(
  products: Product[], 
  budget: number,
  includeNearBudget: boolean = false
): Product[] {
  // Fallback na max cenu pokud je budget neplatný
  const validBudget = budget && budget > 0 ? budget : 150000;
  const maxPrice = includeNearBudget ? validBudget * 1.15 : validBudget;
  return products.filter(p => p.price_czk <= maxPrice);
}

/**
 * Identifikuje bomby (premium produkty lehce nad rozpočtem)
 * 
 * Pravidla:
 * 1. Cena musí být v rozmezí bomb threshold
 * 2. Max N bomb podle cenového pásma
 * 3. Preferuje vyšší skóre (kvalitní produkty)
 */
export function identifyBombs(
  products: Product[],
  budget: number,
  maxBombs: number = 2,
  scoreMap?: Map<string, number> // Volitelné skóre pro lepší výběr
): Product[] {
  const threshold = calculateBombThreshold(budget);
  
  // Najdi kandidáty na bomby
  const candidates = products.filter(p => 
    p.price_czk > budget && 
    p.price_czk >= threshold.min && 
    p.price_czk <= threshold.max
  );
  
  // Seřaď podle skóre (pokud je), jinak podle ceny (nejlevnější bomby první)
  candidates.sort((a, b) => {
    if (scoreMap) {
      const scoreA = scoreMap.get(a.id) || 0;
      const scoreB = scoreMap.get(b.id) || 0;
      return scoreB - scoreA; // Vyšší skóre první
    }
    return a.price_czk - b.price_czk; // Levnější první
  });
  
  return candidates.slice(0, maxBombs);
}

/**
 * Kategorizuje produkt jako "v rozpočtu", "lehce nad", nebo "bomba"
 */
export function categorizeByBudget(
  product: Product,
  budget: number
): 'within' | 'near' | 'bomb' | 'over' {
  const price = product.price_czk;
  const threshold = calculateBombThreshold(budget);
  
  if (price <= budget) return 'within';
  if (price <= budget * 1.15) return 'near';
  if (price <= threshold.max) return 'bomb';
  return 'over';
}
