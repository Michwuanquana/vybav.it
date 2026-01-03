/**
 * Type definitions for CSV import
 */

export interface CSVRow {
  // Common fields
  [key: string]: string;
  
  // IKEA specific
  price?: string;
  price2?: string;
  data?: string;  // Series name
  data2?: string; // Full name
  data3?: string;
  data4?: string;
  image?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  image7?: string;
  
  // JYSK specific
  title?: string;
  name?: string;
}

export interface ParsedProduct {
  id: string;
  name: string;
  brand: 'IKEA' | 'JYSK';
  category: string;
  dimensions_cm: object | null;
  color: string | null;
  material: string | null;
  price_czk: number;
  image_url: string;
  affiliate_url: string;
  description_visual: string;
  availability_status?: string;
  stock_info?: string;
  is_seasonal?: boolean;
  season?: string | null;
  collection_name?: string;
  style_tags?: string[];
  additional_images?: string[];
  search_keywords?: string[];
}

export interface ImportStats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
}
