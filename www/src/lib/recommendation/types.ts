/**
 * Recommendation System - Type Definitions
 * 
 * Centralizované typy pro doporučovací systém.
 */

export interface Product {
  id: string;
  name: string;
  brand: string;
  price_czk: number;
  image_url: string;
  affiliate_url: string;
  style_tags: string[];
  material: string;
  color: string;
  category?: string;
  width_cm?: number;
  depth_cm?: number;
  height_cm?: number;
}

export interface AIRecommendation {
  item: string;
  reason: string;
  suggested_style: string;
  suggested_color: string;
  priority?: number;
  size_category?: 'large' | 'medium' | 'small';
  placement_coordinates?: {
    x: number;
    y: number;
    note?: string;
  };
}

export interface RecommendationConfig {
  // Základní filtry
  style?: string;
  room?: string;
  budget: number;
  
  // AI kontext
  recommendations?: AIRecommendation[];
  contextual_queries?: string[];
  furnishing_level?: number; // 0-100%
  focus_area?: string;
  
  // Parametry výběru
  limit?: number;
  includeNearBudget?: boolean; // Povolit produkty lehce nad rozpočtem
  
  // Bomby (upsell)
  enableBombs?: boolean;
  maxBombs?: number;
}

export interface BombConfig {
  minPercentage: number;  // Minimální % nad rozpočet
  maxPercentage: number;  // Maximální % nad rozpočet
  maxCount: number;       // Max počet bomb
}

export interface ProductScore {
  product: Product;
  score: number;
  reasons: string[];
  isBomb?: boolean;
}

export interface RecommendationResult {
  products: Product[];
  bombs: Product[];
  total: number;
  config: RecommendationConfig;
  debug?: {
    scoredProducts: ProductScore[];
    bombThreshold: { min: number; max: number };
  };
}

export type PriceTier = 'budget' | 'mid' | 'premium';

export interface StyleMatch {
  style: string;
  weight: number;
}
