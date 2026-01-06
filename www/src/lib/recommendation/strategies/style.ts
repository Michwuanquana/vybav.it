/**
 * Style Strategy - Stylové řazení a shoda
 * 
 * Logika pro párování produktů se stylem místnosti a AI doporučeními.
 */

import { Product, AIRecommendation, StyleMatch } from '../types';

/**
 * Mapování stylů na související styly (fallback)
 */
const STYLE_RELATIVES: Record<string, string[]> = {
  'scandinavian': ['minimalist', 'modern', 'nordic'],
  'industrial': ['modern', 'minimalist', 'loft'],
  'minimalist': ['scandinavian', 'modern', 'japanese'],
  'traditional': ['classic', 'vintage', 'country'],
  'modern': ['scandinavian', 'minimalist', 'contemporary'],
  'boho': ['eclectic', 'vintage', 'natural'],
  'rustic': ['country', 'traditional', 'farmhouse']
};

/**
 * Normalizuje název stylu (lowercase, bez diakritiky)
 */
function normalizeStyle(style: string): string {
  return style
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Vypočítá skóre shody produktu se stylem
 * 
 * @returns 0-100 (100 = perfektní shoda, 0 = žádná shoda)
 */
export function calculateStyleScore(product: Product, targetStyle: string): number {
  const normalizedTarget = normalizeStyle(targetStyle);
  const productStyles = product.style_tags.map(normalizeStyle);
  
  // Přesná shoda = 100
  if (productStyles.includes(normalizedTarget)) {
    return 100;
  }
  
  // Příbuzný styl = 70
  const relatives = STYLE_RELATIVES[normalizedTarget] || [];
  for (const relative of relatives) {
    if (productStyles.includes(normalizeStyle(relative))) {
      return 70;
    }
  }
  
  // Žádná shoda = 0
  return 0;
}

/**
 * Skóruje produkt podle AI doporučení
 * 
 * Zohledňuje:
 * - Přesnou shodu názvu položky
 * - Stylovou shodu
 * - Barevnou shodu
 * - Prioritu doporučení
 */
export function calculateRecommendationScore(
  product: Product,
  recommendations: AIRecommendation[]
): number {
  let maxScore = 0;
  
  for (const rec of recommendations) {
    let score = 0;
    const itemLower = rec.item.toLowerCase();
    const productNameLower = product.name.toLowerCase();
    
    // Shoda názvu (např. "stolek" v "Konferenční stolek LACK")
    if (productNameLower.includes(itemLower)) {
      score += 50;
    }
    
    // Stylová shoda
    const styleScore = calculateStyleScore(product, rec.suggested_style);
    score += styleScore * 0.3; // 30% váha
    
    // Barevná shoda (fuzzy)
    if (rec.suggested_color && product.color) {
      const colorLower = rec.suggested_color.toLowerCase();
      const productColorLower = product.color.toLowerCase();
      if (productColorLower.includes(colorLower) || colorLower.includes(productColorLower)) {
        score += 20;
      }
    }
    
    // Bonus za prioritu (priority 1 = +10, priority 2 = +5, atd.)
    const priorityBonus = Math.max(0, 15 - (rec.priority || 5) * 3);
    score += priorityBonus;
    
    maxScore = Math.max(maxScore, score);
  }
  
  return maxScore;
}

/**
 * Filtruje produkty podle stylu (fuzzy matching)
 */
export function filterByStyle(
  products: Product[],
  targetStyle: string,
  minScore: number = 50
): Product[] {
  return products.filter(p => calculateStyleScore(p, targetStyle) >= minScore);
}

/**
 * Získá seznam relevantních stylů pro místnost
 */
export function getRelevantStyles(roomType: string): string[] {
  const roomStyleMap: Record<string, string[]> = {
    'living': ['scandinavian', 'modern', 'minimalist', 'industrial'],
    'bedroom': ['scandinavian', 'minimalist', 'traditional', 'boho'],
    'kids': ['modern', 'scandinavian', 'playful', 'colorful'],
    'office': ['minimalist', 'modern', 'industrial', 'scandinavian'],
    'other': ['scandinavian', 'modern', 'minimalist']
  };
  
  return roomStyleMap[roomType] || roomStyleMap['other'];
}

/**
 * Získá seznam relevantních kategorií produktů pro daný typ místnosti
 */
export function getRelevantCategories(roomType: string): string[] {
  const roomCategoryMap: Record<string, string[]> = {
    'living': ['sofa', 'table', 'coffee_table', 'shelving', 'rug', 'lamp', 'mirror', 'wall_art', 'picture_frame'],
    'bedroom': ['bed', 'nightstand', 'wardrobe', 'mirror', 'lamp', 'rug', 'picture_frame', 'wall_art'],
    'kids': ['bed', 'wardrobe', 'shelving', 'toy_storage', 'lamp', 'rug', 'wall_art', 'poster'],
    'office': ['desk', 'chair', 'shelving', 'lamp', 'storage', 'rug', 'wall_art', 'picture_frame'],
    'other': ['sofa', 'table', 'chair', 'lamp', 'shelving', 'rug', 'picture_frame']
  };
  
  return roomCategoryMap[roomType] || roomCategoryMap['other'];
}
