/**
 * Recommendation System - Main Export
 * 
 * Centralizovaný doporučovací systém pro Vybaveno.cz
 */

// Main engine
export { 
  getRecommendations, 
  getDiscoveryRecommendations,
  getAIRecommendations 
} from './engine';

// Types
export type { 
  Product, 
  RecommendationConfig, 
  RecommendationResult,
  ProductScore,
  AIRecommendation,
  BombConfig,
  PriceTier,
  StyleMatch
} from './types';

// Strategies (pro advanced použití)
export * from './strategies/budget';
export * from './strategies/style';
export * from './strategies/furnishing';
export * from './strategies/fts';
