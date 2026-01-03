/**
 * Product Validator
 * Validates parsed product data before database import
 */

import type { ParsedProduct } from '../types';
import { isValidImageUrl } from '../parsers/utils';

export interface ValidationError {
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class ProductValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  validate(product: ParsedProduct): ValidationResult {
    this.errors = [];
    this.warnings = [];

    // Required fields validation
    this.validateRequired(product);
    
    // Data type validation
    this.validateTypes(product);
    
    // Business logic validation
    this.validateBusinessRules(product);
    
    // Data quality validation
    this.validateDataQuality(product);

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  private validateRequired(product: ParsedProduct) {
    const required = ['id', 'name', 'brand', 'category', 'price_czk', 'image_url', 'affiliate_url'];
    
    for (const field of required) {
      if (!product[field as keyof ParsedProduct]) {
        this.addError(field, product[field as keyof ParsedProduct], `${field} is required`);
      }
    }
  }

  private validateTypes(product: ParsedProduct) {
    // Validate ID format
    if (product.id && !this.isValidId(product.id)) {
      this.addError('id', product.id, 'Invalid ID format');
    }

    // Validate price
    if (product.price_czk !== undefined) {
      if (typeof product.price_czk !== 'number') {
        this.addError('price_czk', product.price_czk, 'Price must be a number');
      } else if (product.price_czk < 0) {
        this.addError('price_czk', product.price_czk, 'Price cannot be negative');
      } else if (product.price_czk === 0) {
        this.addWarning('price_czk', product.price_czk, 'Price is zero');
      }
    }

    // Validate URLs
    if (product.image_url) {
      if (!this.isValidUrl(product.image_url)) {
        this.addError('image_url', product.image_url, 'Invalid image URL format');
      } else if (!isValidImageUrl(product.image_url, product.brand as 'IKEA' | 'JYSK')) {
        this.addError('image_url', product.image_url, `Image URL does not match expected ${product.brand} format`);
      }
    }

    if (product.affiliate_url && !this.isValidUrl(product.affiliate_url)) {
      this.addError('affiliate_url', product.affiliate_url, 'Invalid affiliate URL');
    }

    // Validate brand
    if (product.brand && !['IKEA', 'JYSK'].includes(product.brand)) {
      this.addError('brand', product.brand, 'Brand must be IKEA or JYSK');
    }

    // Validate dimensions
    if (product.dimensions_cm !== null && typeof product.dimensions_cm !== 'object') {
      this.addError('dimensions_cm', product.dimensions_cm, 'Dimensions must be an object or null');
    }

    // Validate additional images
    if (product.additional_images) {
      if (!Array.isArray(product.additional_images)) {
        this.addError('additional_images', product.additional_images, 'Additional images must be an array');
      } else {
        for (const url of product.additional_images) {
          if (!this.isValidUrl(url)) {
            this.addError('additional_images', url, `Invalid image URL: ${url}`);
          }
        }
      }
    }
  }

  private validateBusinessRules(product: ParsedProduct) {
    // Price ranges by category
    if (product.price_czk && product.category) {
      const priceRanges: Record<string, { min: number; max: number }> = {
        'sofa': { min: 1000, max: 150000 },
        'chair': { min: 50, max: 50000 },
        'table': { min: 100, max: 100000 },
        'bed': { min: 200, max: 150000 },
        'lighting': { min: 20, max: 50000 },
        'decoration': { min: 5, max: 20000 },
      };

      const range = priceRanges[product.category];
      if (range) {
        if (product.price_czk < range.min) {
          this.addWarning('price_czk', product.price_czk, 
            `Price unusually low for ${product.category} (expected min: ${range.min} CZK)`);
        }
        if (product.price_czk > range.max) {
          this.addWarning('price_czk', product.price_czk,
            `Price unusually high for ${product.category} (expected max: ${range.max} CZK)`);
        }
      }
    }

    // Validate dimensions ranges
    if (product.dimensions_cm) {
      const dims = product.dimensions_cm as any;
      
      if (dims.width !== undefined && (dims.width < 0.1 || dims.width > 1000)) {
        this.addError('dimensions_cm.width', dims.width, 'Width out of realistic range (0.1-1000 cm)');
      }
      
      if (dims.height !== undefined && (dims.height < 0.1 || dims.height > 1000)) {
        this.addError('dimensions_cm.height', dims.height, 'Height out of realistic range (0.1-1000 cm)');
      }
      
      if (dims.depth !== undefined && (dims.depth < 0.1 || dims.depth > 1000)) {
        this.addError('dimensions_cm.depth', dims.depth, 'Depth out of realistic range (0.1-1000 cm)');
      }

      if (dims.length !== undefined && (dims.length < 0.1 || dims.length > 10000)) {
        this.addError('dimensions_cm.length', dims.length, 'Length out of realistic range (0.1-10000 cm)');
      }

      if (dims.diameter !== undefined && (dims.diameter < 0.1 || dims.diameter > 1000)) {
        this.addError('dimensions_cm.diameter', dims.diameter, 'Diameter out of realistic range (0.1-1000 cm)');
      }
    }

    // Seasonal product validation
    if (product.is_seasonal && !product.season) {
      this.addWarning('season', product.season, 'Seasonal product should have a season specified');
    }
  }

  private validateDataQuality(product: ParsedProduct) {
    // Name length
    if (product.name && product.name.length < 3) {
      this.addError('name', product.name, 'Product name too short (min 3 characters)');
    }
    if (product.name && product.name.length > 200) {
      this.addWarning('name', product.name, 'Product name very long (>200 characters)');
    }

    // Category validation
    const validCategories = [
      'coffee_table', 'dining_table', 'desk', 'nightstand', 'table',
      'chair', 'sofa', 'bed', 'wardrobe', 'dresser', 'shelf', 'shoe_cabinet',
      'floor_lamp', 'table_lamp', 'ceiling_light', 'lighting', 'chandelier', 'candle',
      'rug', 'curtain', 'bedding', 'pillow', 'blanket', 'table_textile',
      'mirror', 'picture_frame', 'vase', 'clock', 'decoration',
      'storage_box', 'other'
    ];

    if (product.category && !validCategories.includes(product.category)) {
      this.addWarning('category', product.category, `Unknown category: ${product.category}`);
    }

    // Color validation
    const validColors = [
      'white', 'black', 'gray', 'gold', 'silver', 'brown', 'red', 'blue', 'green',
      'yellow', 'pink', 'beige', 'natural', 'sand', 'light', 'dark',
      'dark_pink', 'dark_green', 'gray_turquoise', 'black_brown', 'anthracite',
      'turquoise', 'orange', 'purple', 'cream', 'multicolor'
    ];

    if (product.color && !validColors.includes(product.color)) {
      this.addWarning('color', product.color, `Unknown color: ${product.color}`);
    }

    // Material validation
    const validMaterials = [
      'bamboo', 'wood', 'oak', 'pine', 'beech', 'birch', 'ash', 'acacia', 'walnut', 'spruce',
      'metal', 'stainless_steel', 'glass', 'stoneware', 'ceramic', 'plastic', 'textile', 
      'fabric', 'carpet', 'faux_leather', 'steel', 'marble', 'velvet', 'leather', 
      'rattan', 'jute', 'wool', 'cotton', 'polyester', 'aluminum', 'brass', 'copper', 
      'engineered_wood', 'solid_wood', 'paper', 'cork', 'concrete', 'travertine'
    ];

    if (product.material && !validMaterials.includes(product.material) && 
        !product.material.startsWith('engineered_wood') && 
        !product.material.startsWith('solid_wood')) {
      this.addWarning('material', product.material, `Unknown material: ${product.material}`);
    }

    // Check for missing important data
    if (!product.dimensions_cm) {
      this.addWarning('dimensions_cm', null, 'No dimensions data available');
    }

    if (!product.color) {
      this.addWarning('color', null, 'No color information available');
    }

    if (!product.material) {
      this.addWarning('material', null, 'No material information available');
    }
  }

  private isValidId(id: string): boolean {
    // ID should be: brand-hash (e.g., ikea-abc123def456)
    return /^(ikea|jysk)-[a-f0-9]{12}$/.test(id);
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private addError(field: string, value: any, message: string) {
    this.errors.push({ field, value, message, severity: 'error' });
  }

  private addWarning(field: string, value: any, message: string) {
    this.warnings.push({ field, value, message, severity: 'warning' });
  }
}

/**
 * Validate multiple products and aggregate results
 */
export function validateBatch(products: ParsedProduct[]): {
  valid: Array<{ product: ParsedProduct; result: ValidationResult }>;
  invalid: Array<{ product: ParsedProduct; result: ValidationResult }>;
  stats: {
    total: number;
    valid: number;
    invalid: number;
    withWarnings: number;
  };
} {
  const validator = new ProductValidator();
  const valid: Array<{ product: ParsedProduct; result: ValidationResult }> = [];
  const invalid: Array<{ product: ParsedProduct; result: ValidationResult }> = [];
  let withWarnings = 0;

  for (const product of products) {
    const result = validator.validate(product);
    
    if (result.isValid) {
      valid.push({ product, result });
      if (result.warnings.length > 0) {
        withWarnings++;
      }
    } else {
      invalid.push({ product, result });
    }
  }

  return {
    valid,
    invalid,
    stats: {
      total: products.length,
      valid: valid.length,
      invalid: invalid.length,
      withWarnings,
    },
  };
}
