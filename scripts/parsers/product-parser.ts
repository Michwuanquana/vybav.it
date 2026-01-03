/**
 * Product Parser
 * Parses CSV rows from IKEA and JYSK into structured product data
 */

import type { CSVRow, ParsedProduct } from '../types';
import { 
  generateProductId, 
  extractDimensions, 
  extractColor, 
  extractMaterial, 
  detectCategory, 
  detectStyle,
  cleanPrice,
  isValidImageUrl 
} from './utils';

export class ProductParser {
  constructor(private brand: 'IKEA' | 'JYSK') {}

  parse(row: CSVRow): ParsedProduct | null {
    // If the row already has an 'id' and 'price_czk', it's likely a cleaned CSV
    if (row.id && row.price_czk && row.image_url) {
      const product = {
        ...row,
        price_czk: Number(row.price_czk),
        dimensions_cm: (typeof row.dimensions_cm === 'string' && row.dimensions_cm.trim() !== '') 
          ? JSON.parse(row.dimensions_cm) 
          : (row.dimensions_cm || null),
        additional_images: typeof row.additional_images === 'string' ? row.additional_images.split(',').filter(Boolean) : row.additional_images,
        search_keywords: typeof row.search_keywords === 'string' ? row.search_keywords.split(',').filter(Boolean) : row.search_keywords,
        is_seasonal: row.is_seasonal === 'true' || row.is_seasonal === true,
      } as ParsedProduct;

      // Try to re-extract dimensions if missing
      if (!product.dimensions_cm && product.name) {
        product.dimensions_cm = extractDimensions(product.name);
      }

      return product;
    }

    if (this.brand === 'IKEA') {
      return this.parseIkea(row);
    } else {
      return this.parseJysk(row);
    }
  }

  private parseIkea(row: CSVRow): ParsedProduct | null {
    // IKEA CSV structure is very inconsistent. We need to find the best name
    // and series from multiple possible columns.
    
    const nameCandidates = [
      row.data6, row.data3, row.data2, row.price5, row.data4, row.data
    ].filter(Boolean).map(s => s!.replace(/Další možnosti/g, '').trim());

    // Prefer name that contains dimensions (x, cm, Ø)
    let name = nameCandidates.find(n => n.match(/(\d+\s*[x×]\s*\d+|cm|Ø)/i)) || nameCandidates[0];
    
    const seriesName = row.data || row.price4 || row.data3 || row.data5 || '';
    const price = cleanPrice(row.price);
    
    // Try all possible image columns
    const imageUrl = row.image || row.image2 || row.image3 || row.image4 || 
                    row.image5 || row.image6 || row.image7 || row.image8;
    
    // Stock info is usually in later data columns
    const stockInfo = [row.data7, row.data8, row.data4, row.data5]
      .filter(Boolean).find(s => s!.includes('skladem') || s!.includes('vyprodáno')) || '';
    
    if (!name || !price || !imageUrl || 
        name.match(/^\+\d+$/) || 
        name.includes('Při nákupu online') ||
        name.length < 3 ||
        !isValidImageUrl(imageUrl, 'IKEA')) {
      return null; // Skip invalid rows, junk like "+7", or invalid image URLs
    }
    
    // Generate unique ID
    const id = generateProductId(this.brand, seriesName, name);
    
    // Extract dimensions from name, or fallback to searching all columns
    let dimensions = extractDimensions(name);
    if (!dimensions) {
      for (const key in row) {
        const val = row[key];
        if (val && typeof val === 'string' && val.match(/(\d+\s*[x×*]\s*\d+|cm|Ø|V\d+|Š\d+|D\d+)/i)) {
          const found = extractDimensions(val);
          if (found) {
            dimensions = found;
            break;
          }
        }
      }
    }
    
    // Extract color and material
    const color = extractColor(name);
    let material = extractMaterial(name);
    if (!material) {
      // Only search relevant data columns, avoid URLs and metadata
      const materialCandidates = [
        row.data, row.data2, row.data3, row.data4, row.data5, row.data6,
        row.data7, row.data8, row.data9, row.data10, row.data11, row.data12,
        row.price4, row.price5
      ];
      
      for (const val of materialCandidates) {
        if (val && typeof val === 'string') {
          const found = extractMaterial(val);
          if (found) {
            material = found;
            break;
          }
        }
      }
    }
    
    // Detect category
    const category = detectCategory(name);
    
    // Collect additional images
    const additionalImages = [row.image2, row.image3, row.image4, row.image5, row.image6, row.image7]
      .filter(Boolean) as string[];
    
    // Detect seasonal products
    const isSeasonal = this.detectSeasonal(name);
    const season = isSeasonal ? this.detectSeason(name) : null;
    
    // Generate affiliate URL (placeholder - should be actual IKEA affiliate link)
    const affiliateUrl = `https://www.ikea.com/cz/cs/p/${id}`;
    
    // Try to find a better description than just the name
    // IKEA often puts features/description in data7, data8, etc.
    const descriptionCandidates = [row.data7, row.data8, row.data9, row.data10]
      .filter(Boolean)
      .filter(s => s && s.length > 10 && !s.includes('skladem') && !s.includes('vyprodáno'));
    
    const description = descriptionCandidates.length > 0 ? descriptionCandidates.join('. ') : name;

    // Detect style
    const styleTags = detectStyle(name, seriesName, material);

    return {
      id,
      name,
      brand: this.brand,
      category,
      dimensions_cm: dimensions,
      color,
      material,
      price_czk: price,
      image_url: imageUrl,
      affiliate_url: affiliateUrl,
      description_visual: description,
      availability_status: this.parseAvailability(stockInfo),
      stock_info: stockInfo,
      is_seasonal: isSeasonal,
      season,
      collection_name: seriesName,
      style_tags: styleTags,
      additional_images: additionalImages,
      search_keywords: this.generateKeywords(name, seriesName, category),
    };
  }

  private parseJysk(row: CSVRow): ParsedProduct | null {
    // JYSK CSV structure:
    // image, data, data2, data3, title, name, price (unit), price2 (value), data4
    
    const name = row.name || row.title;
    const seriesName = row.title; // e.g., "RAV", "MODI"
    
    // In JYSK CSV, price is often the unit (/ks) and price2 is the value
    let price = cleanPrice(row.price2);
    if (price === null) {
      price = cleanPrice(row.price);
    }
    
    const imageUrl = row.image;
    const stockInfo = row.data4;
    const hasVariants = row.data2?.includes('Více variant');
    
    if (!name || price === null || !imageUrl || !isValidImageUrl(imageUrl, 'JYSK')) {
      return null;
    }
    
    const id = generateProductId(this.brand, seriesName, name);
    
    let dimensions = extractDimensions(name);
    if (!dimensions) {
      for (const key in row) {
        const val = row[key];
        if (val && typeof val === 'string' && val.match(/(\d+\s*[x×*]\s*\d+|cm|Ø|V\d+|Š\d+|D\d+)/i)) {
          const found = extractDimensions(val);
          if (found) {
            dimensions = found;
            break;
          }
        }
      }
    }

    const color = extractColor(name);
    const material = extractMaterial(name);
    const category = detectCategory(name);
    const styleTags = detectStyle(name, seriesName, material);
    
    const isSeasonal = this.detectSeasonal(name);
    const season = isSeasonal ? this.detectSeason(name) : null;
    
    const affiliateUrl = `https://jysk.cz/p/${id}`;
    
    return {
      id,
      name,
      brand: this.brand,
      category,
      dimensions_cm: dimensions,
      color,
      material,
      price_czk: price,
      image_url: imageUrl,
      affiliate_url: affiliateUrl,
      description_visual: name,
      availability_status: this.parseAvailability(stockInfo),
      stock_info: stockInfo,
      is_seasonal: isSeasonal,
      season,
      collection_name: seriesName,
      style_tags: styleTags,
      additional_images: [],
      search_keywords: this.generateKeywords(name, seriesName, category),
    };
  }

  private parseAvailability(stockInfo?: string): string {
    if (!stockInfo) return 'in_stock';
    
    const lower = stockInfo.toLowerCase();
    if (lower.includes('vyprodání') || lower.includes('skladem')) {
      return 'low_stock';
    }
    if (lower.includes('není skladem') || lower.includes('nedostupné')) {
      return 'out_of_stock';
    }
    if (lower.includes('novinka')) {
      return 'in_stock';
    }
    
    return 'in_stock';
  }

  private detectSeasonal(name: string): boolean {
    const seasonalKeywords = [
      'vánoční', 'christmas', 'xmas', 'vánoce',
      'velikonoční', 'easter',
      'letní', 'summer',
      'zimní', 'winter',
    ];
    
    const lower = name.toLowerCase();
    return seasonalKeywords.some(keyword => lower.includes(keyword));
  }

  private detectSeason(name: string): string | null {
    const lower = name.toLowerCase();
    
    if (lower.includes('vánoční') || lower.includes('christmas')) return 'christmas';
    if (lower.includes('velikonoční') || lower.includes('easter')) return 'easter';
    if (lower.includes('letní') || lower.includes('summer')) return 'summer';
    if (lower.includes('zimní') || lower.includes('winter')) return 'winter';
    
    return null;
  }

  private generateKeywords(name: string, seriesName: string, category: string): string[] {
    const keywords = new Set<string>();
    
    // Add series name
    if (seriesName) keywords.add(seriesName.toLowerCase());
    
    // Add category
    keywords.add(category.toLowerCase());
    
    // Extract words from name
    const words = name
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(word => word.length > 2);
    
    words.forEach(word => keywords.add(word));
    
    // Add brand
    keywords.add(this.brand.toLowerCase());
    
    return Array.from(keywords);
  }
}
