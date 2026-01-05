/**
 * Furnishing Strategy - Prioritizace podle zaplněnosti místnosti
 * 
 * Prázdné místnosti preferují velký nábytek (pohovky, postele).
 * Plné místnosti preferují doplňky (lampy, dekorace).
 */

import { Product, AIRecommendation } from '../types';

/**
 * Kategorie velikosti produktů
 */
const SIZE_KEYWORDS = {
  large: [
    'pohovka', 'sofa', 'gauč', 'sedací souprava',
    'postel', 'skříň', 'komoda', 'stůl', 'jídelní stůl',
    'tv stolek', 'knihovna', 'regál', 'rohová sedačka'
  ],
  medium: [
    'křeslo', 'židle', 'stolek', 'konferenční stolek',
    'noční stolek', 'police', 'zrcadlo', 'koberec'
  ],
  small: [
    'lampa', 'svícen', 'váza', 'květináč', 'dekorace',
    'polštář', 'deka', 'obraz', 'hodiny', 'svítidlo'
  ]
};

/**
 * Určí velikostní kategorii produktu na základě názvu
 */
export function detectProductSize(product: Product): 'large' | 'medium' | 'small' {
  const nameLower = product.name.toLowerCase();
  
  // Prioritizujeme large (nejdůležitější)
  for (const keyword of SIZE_KEYWORDS.large) {
    if (nameLower.includes(keyword)) return 'large';
  }
  
  for (const keyword of SIZE_KEYWORDS.medium) {
    if (nameLower.includes(keyword)) return 'medium';
  }
  
  for (const keyword of SIZE_KEYWORDS.small) {
    if (nameLower.includes(keyword)) return 'small';
  }
  
  // Fallback: podle rozměrů (pokud jsou k dispozici)
  if (product.width_cm && product.depth_cm) {
    const area = product.width_cm * product.depth_cm;
    if (area > 10000) return 'large';   // > 100x100 cm
    if (area > 2500) return 'medium';   // > 50x50 cm
    return 'small';
  }
  
  return 'medium'; // Default
}

/**
 * Vypočítá prioritní skóre podle zaplněnosti místnosti
 * 
 * Prázdné (<35%): Large nábytek má bonus +30
 * Částečně (35-75%): Vyváženě
 * Plné (>75%): Doplňky mají bonus +30
 */
export function calculateFurnishingScore(
  product: Product,
  furnishingLevel: number
): number {
  const size = detectProductSize(product);
  
  // Prázdná místnost (<35%)
  if (furnishingLevel < 35) {
    if (size === 'large') return 30;
    if (size === 'medium') return 15;
    return 5; // Small má nízké skóre
  }
  
  // Plná místnost (>75%)
  if (furnishingLevel > 75) {
    if (size === 'small') return 30;
    if (size === 'medium') return 15;
    return 5; // Large má nízké skóre
  }
  
  // Částečně vybavená (35-75%) - neutrální
  return 10;
}

/**
 * Kategorizace místnosti podle zaplněnosti
 */
export function categorizeFurnishingLevel(level: number): 'empty' | 'sparse' | 'furnished' {
  if (level < 35) return 'empty';
  if (level < 75) return 'sparse';
  return 'furnished';
}

/**
 * Doporučené kategorie podle zaplněnosti
 */
export function getRecommendedCategories(furnishingLevel: number): string[] {
  const category = categorizeFurnishingLevel(furnishingLevel);
  
  switch (category) {
    case 'empty':
      return ['large', 'medium']; // Nejprve hlavní nábytek
    case 'sparse':
      return ['medium', 'large', 'small']; // Vyvážené
    case 'furnished':
      return ['small', 'medium']; // Doplňky a detaily
  }
}

/**
 * Filtruje doporučení AI podle velikosti
 */
export function prioritizeRecommendationsBySize(
  recommendations: AIRecommendation[],
  furnishingLevel: number
): AIRecommendation[] {
  const category = categorizeFurnishingLevel(furnishingLevel);
  
  // Seřadíme podle priority a velikosti
  return [...recommendations].sort((a, b) => {
    const priorityDiff = (a.priority || 99) - (b.priority || 99);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Při stejné prioritě preferujeme správnou velikost
    const sizeA = a.size_category || 'medium';
    const sizeB = b.size_category || 'medium';
    
    if (category === 'empty') {
      const orderMap = { large: 0, medium: 1, small: 2 };
      return (orderMap[sizeA] || 1) - (orderMap[sizeB] || 1);
    } else if (category === 'furnished') {
      const orderMap = { small: 0, medium: 1, large: 2 };
      return (orderMap[sizeA] || 1) - (orderMap[sizeB] || 1);
    }
    
    return 0; // Sparse - zachováme pořadí
  });
}
