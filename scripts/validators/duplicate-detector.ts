/**
 * Duplicate Detector
 * Detects duplicate products before import to prevent data corruption
 */

import type { ParsedProduct } from '../types';
import { createHash } from 'crypto';

export interface DuplicateInfo {
  type: 'exact' | 'similar' | 'id_collision';
  product1: ParsedProduct;
  product2: ParsedProduct;
  similarity: number; // 0-1
  reason: string;
}

export class DuplicateDetector {
  private products: Map<string, ParsedProduct> = new Map();
  private nameHashes: Map<string, ParsedProduct> = new Map();
  private buckets: Map<string, ParsedProduct[]> = new Map();
  private duplicates: DuplicateInfo[] = [];

  /**
   * Check if product is duplicate
   * Returns null if not duplicate, otherwise returns duplicate info
   */
  checkDuplicate(product: ParsedProduct): DuplicateInfo | null {
    // Check 1: Exact ID collision
    const existingById = this.products.get(product.id);
    if (existingById) {
      return {
        type: 'id_collision',
        product1: existingById,
        product2: product,
        similarity: 1.0,
        reason: `Product with ID "${product.id}" already exists`,
      };
    }

    // Check 2: Name-based duplicate (exact match)
    const nameHash = this.hashString(product.name);
    const existingByName = this.nameHashes.get(nameHash);
    if (existingByName) {
      return {
        type: 'exact',
        product1: existingByName,
        product2: product,
        similarity: 1.0,
        reason: `Product with name "${product.name}" already exists`,
      };
    }

    // Check 3: Similar product (fuzzy matching)
    const similarProduct = this.findSimilarProduct(product);
    if (similarProduct) {
      // If it's already marked as 'exact' (e.g. same image), return it
      if (similarProduct.type === 'exact') {
        return similarProduct;
      }
      // Otherwise only return if similarity is very high (94%+)
      if (similarProduct.similarity >= 0.94) {
        return similarProduct;
      }
    }

    return null;
  }

  /**
   * Add product to tracking (use after successful validation)
   */
  addProduct(product: ParsedProduct) {
    this.products.set(product.id, product);
    this.nameHashes.set(this.hashString(product.name), product);
    
    // Add to buckets for faster similarity search
    const bucketKeys = this.getBucketKeys(product);
    for (const key of bucketKeys) {
      if (!this.buckets.has(key)) {
        this.buckets.set(key, []);
      }
      this.buckets.get(key)!.push(product);
    }
  }

  /**
   * Get bucket keys for a product
   */
  private getBucketKeys(product: ParsedProduct): string[] {
    const keys: string[] = [];
    
    // Primary bucket: Collection
    if (product.collection_name) {
      keys.push(`coll:${product.collection_name.toLowerCase()}`);
    }
    
    // Secondary bucket: Category + Brand
    if (product.category) {
      keys.push(`cat:${product.brand}:${product.category}`);
    }
    
    return keys;
  }

  /**
   * Find similar products using fuzzy matching
   */
  private findSimilarProduct(product: ParsedProduct): DuplicateInfo | null {
    const bucketKeys = this.getBucketKeys(product);
    const checkedIds = new Set<string>();

    for (const key of bucketKeys) {
      const bucket = this.buckets.get(key);
      if (!bucket) continue;

      for (const existing of bucket) {
        if (checkedIds.has(existing.id)) continue;
        checkedIds.add(existing.id);

        const sameImage = existing.image_url === product.image_url;

        // Skip same brand comparison for now (unless it's the same collection or same image)
        if (existing.brand !== product.brand && !product.collection_name && !sameImage) {
          continue;
        }

        // Fast path: if name lengths differ too much, they can't be similar enough
        // If images match, we are more lenient (25% length diff), otherwise strict (10%)
        const lenDiff = Math.abs(existing.name.length - product.name.length);
        const maxLen = Math.max(existing.name.length, product.name.length);
        const maxLenDiff = sameImage ? 0.25 : 0.1;
        
        if (lenDiff / maxLen > maxLenDiff) continue;

        const similarity = this.calculateSimilarity(existing, product);
        
        // If images are identical, we are much more aggressive with merging
        if (sameImage && similarity >= 0.80) {
          return {
            type: 'exact',
            product1: existing,
            product2: product,
            similarity,
            reason: `Similar product (${Math.round(similarity * 100)}%) with identical image URL`,
          };
        }

        if (similarity >= 0.94) {
          return {
            type: 'similar',
            product1: existing,
            product2: product,
            similarity,
            reason: this.buildSimilarityReason(existing, product, similarity),
          };
        }
      }
    }

    return null;
  }

  /**
   * Calculate similarity between two products
   */
  private calculateSimilarity(p1: ParsedProduct, p2: ParsedProduct): number {
    let score = 0;
    let factors = 0;

    // Name similarity (weight: 40%)
    const nameSim = this.stringSimilarity(p1.name, p2.name);
    score += nameSim * 0.4;
    factors += 0.4;

    // Brand match (weight: 10%)
    if (p1.brand === p2.brand) {
      score += 0.1;
    }
    factors += 0.1;

    // Category match (weight: 10%)
    if (p1.category === p2.category) {
      score += 0.1;
    }
    factors += 0.1;

    // Price similarity (weight: 15%)
    if (p1.price_czk && p2.price_czk) {
      const priceDiff = Math.abs(p1.price_czk - p2.price_czk);
      const avgPrice = (p1.price_czk + p2.price_czk) / 2;
      const priceSim = Math.max(0, 1 - (priceDiff / avgPrice));
      score += priceSim * 0.15;
      factors += 0.15;
    }

    // Dimensions similarity (weight: 15%)
    if (p1.dimensions_cm && p2.dimensions_cm) {
      const dimSim = this.dimensionsSimilarity(p1.dimensions_cm as any, p2.dimensions_cm as any);
      score += dimSim * 0.15;
      factors += 0.15;
    }

    // Collection name match (weight: 10%)
    if (p1.collection_name && p2.collection_name) {
      if (p1.collection_name === p2.collection_name) {
        score += 0.1;
      }
      factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  private stringSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
    }
    return costs[s2.length];
  }

  /**
   * Calculate dimensions similarity
   */
  private dimensionsSimilarity(d1: any, d2: any): number {
    const keys = ['width', 'height', 'depth', 'diameter'];
    let matches = 0;
    let total = 0;

    for (const key of keys) {
      if (d1[key] !== undefined && d2[key] !== undefined) {
        total++;
        const diff = Math.abs(d1[key] - d2[key]);
        const avg = (d1[key] + d2[key]) / 2;
        const sim = Math.max(0, 1 - (diff / avg));
        
        // Consider similar if within 5% difference
        if (sim > 0.95) {
          matches++;
        }
      }
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Build human-readable similarity reason
   */
  private buildSimilarityReason(p1: ParsedProduct, p2: ParsedProduct, similarity: number): string {
    const reasons: string[] = [];

    if (this.stringSimilarity(p1.name, p2.name) > 0.8) {
      reasons.push('very similar names');
    }

    if (p1.collection_name === p2.collection_name && p1.collection_name) {
      reasons.push(`same collection (${p1.collection_name})`);
    }

    if (p1.price_czk && p2.price_czk) {
      const priceDiff = Math.abs(p1.price_czk - p2.price_czk);
      if (priceDiff < 100) {
        reasons.push(`similar price (${p1.price_czk} vs ${p2.price_czk} CZK)`);
      }
    }

    if (p1.dimensions_cm && p2.dimensions_cm) {
      const dimSim = this.dimensionsSimilarity(p1.dimensions_cm as any, p2.dimensions_cm as any);
      if (dimSim > 0.9) {
        reasons.push('nearly identical dimensions');
      }
    }

    const reasonText = reasons.length > 0 
      ? reasons.join(', ')
      : 'multiple matching attributes';

    return `${Math.round(similarity * 100)}% similar: ${reasonText}`;
  }

  /**
   * Hash string for quick lookup
   */
  private hashString(str: string): string {
    return createHash('md5')
      .update(str.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Get all detected duplicates
   */
  getDuplicates(): DuplicateInfo[] {
    return this.duplicates;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalProducts: this.products.size,
      totalDuplicates: this.duplicates.length,
      exactDuplicates: this.duplicates.filter(d => d.type === 'exact').length,
      similarDuplicates: this.duplicates.filter(d => d.type === 'similar').length,
      idCollisions: this.duplicates.filter(d => d.type === 'id_collision').length,
    };
  }

  /**
   * Clear all tracked products
   */
  clear() {
    this.products.clear();
    this.nameHashes.clear();
    this.buckets.clear();
    this.duplicates = [];
  }
}

/**
 * Detect duplicates in a batch of products
 */
export function detectDuplicates(products: ParsedProduct[]): {
  unique: ParsedProduct[];
  duplicates: DuplicateInfo[];
  stats: ReturnType<DuplicateDetector['getStats']>;
} {
  const detector = new DuplicateDetector();
  const unique: ParsedProduct[] = [];

  for (const product of products) {
    const duplicate = detector.checkDuplicate(product);
    
    if (!duplicate) {
      unique.push(product);
      detector.addProduct(product);
    } else {
      // Store duplicate for reporting
      detector.getDuplicates().push(duplicate);
    }
  }

  return {
    unique,
    duplicates: detector.getDuplicates(),
    stats: detector.getStats(),
  };
}
