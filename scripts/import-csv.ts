#!/usr/bin/env tsx
/**
 * CSV Product Import Script
 * Imports IKEA and JYSK products from CSV files into Supabase
 * 
 * Usage:
 *   npm run import:csv -- --file=ikea.csv --brand=IKEA
 *   npm run import:csv -- --file=jysk.csv --brand=JYSK
 *   npm run import:csv -- --all
 */

import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { ProductParser } from './parsers/product-parser';
import { ProductValidator } from './validators/product-validator';
import { DuplicateDetector } from './validators/duplicate-detector';
import { LocalDB } from './lib/db';
import type { ParsedProduct, CSVRow } from './types';

// Local database instance
const db = new LocalDB();

interface ImportOptions {
  file?: string;
  brand?: 'IKEA' | 'JYSK';
  all?: boolean;
  limit?: number;
  dryRun?: boolean;
}

class CSVImporter {
  private stats = {
    total: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    validationErrors: 0,
    duplicates: 0,
    warnings: 0,
  };
  
  private validator = new ProductValidator();
  private duplicateDetector = new DuplicateDetector();

  async importFile(filePath: string, brand: 'IKEA' | 'JYSK', options: ImportOptions) {
    console.log(`\n📂 Reading ${brand} CSV from: ${filePath}`);
    
    await db.init();
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rows: CSVRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`📊 Found ${rows.length} rows in CSV`);
    
    const limit = options.limit || rows.length;
    const rowsToProcess = rows.slice(0, limit);
    
    console.log(`⚙️  Processing ${rowsToProcess.length} products...`);
    
    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      this.stats.total++;
      
      try {
        await this.processRow(row, brand, options.dryRun || false);
        
        // Progress update every 100 products
        if ((i + 1) % 100 === 0) {
          console.log(`   Progress: ${i + 1}/${rowsToProcess.length} (${Math.round((i + 1) / rowsToProcess.length * 100)}%)`);
        }
      } catch (error: any) {
        this.stats.errors++;
        console.error(`\n   ❌ FATAL ERROR processing row ${i + 1}:`);
        console.error(`   ${error.message}`);
        
        // Stop on fatal errors (validation or duplicate collision)
        if (error.message.includes('Validation failed') || 
            error.message.includes('Duplicate product')) {
          console.error('\n💥 Import aborted due to fatal error.');
          console.error('   Fix the issue in CSV data and retry.\n');
          throw error; // Re-throw to stop execution
        }
      }
    }
    
    this.printStats();
  }

  private async processRow(row: CSVRow, brand: 'IKEA' | 'JYSK', dryRun: boolean) {
    const parser = new ProductParser(brand);
    const product = parser.parse(row);
    
    if (!product) {
      this.stats.skipped++;
      return;
    }

    // STEP 1: Validate product data
    const validationResult = this.validator.validate(product);
    
    if (!validationResult.isValid) {
      this.stats.validationErrors++;
      console.error(`\n   ❌ VALIDATION FAILED for: ${product.name}`);
      console.error(`   Errors:`);
      validationResult.errors.forEach(err => {
        console.error(`     - ${err.field}: ${err.message} (value: ${JSON.stringify(err.value)})`);
      });
      
      // STOP on validation error
      throw new Error(`Validation failed for product: ${product.name}. Fix errors and retry.`);
    }
    
    // Show warnings but continue
    if (validationResult.warnings.length > 0) {
      this.stats.warnings++;
      if (validationResult.warnings.length <= 3) { // Only show first 3 warnings
        console.warn(`   ⚠️  Warnings for ${product.name}:`);
        validationResult.warnings.slice(0, 3).forEach(warn => {
          console.warn(`     - ${warn.field}: ${warn.message}`);
        });
      }
    }

    // STEP 2: Check for duplicates
    const duplicate = this.duplicateDetector.checkDuplicate(product);
    
    if (duplicate) {
      this.stats.duplicates++;
      console.warn(`\n   🔄 DUPLICATE DETECTED:`);
      console.warn(`   Type: ${duplicate.type}`);
      console.warn(`   Product 1: ${duplicate.product1.name} (${duplicate.product1.id})`);
      console.warn(`   Product 2: ${duplicate.product2.name} (${duplicate.product2.id})`);
      console.warn(`   Similarity: ${Math.round(duplicate.similarity * 100)}%`);
      console.warn(`   Reason: ${duplicate.reason}`);
      
      if (duplicate.type === 'id_collision' || duplicate.type === 'exact') {
        // Skip exact duplicate or ID collision
        console.warn(`   → Skipping duplicate product\n`);
        this.stats.skipped++;
        return;
      } else {
        // For similar products, just warn and skip
        console.warn(`   → Skipping similar product\n`);
        this.stats.skipped++;
        return;
      }
    }
    
    // Register product in duplicate detector
    this.duplicateDetector.addProduct(product);
    
    if (dryRun) {
      console.log('   [DRY RUN] Would import:', product.name);
      this.stats.imported++;
      return;
    }
    
    // Upsert product into local SQLite
    try {
      await db.upsertProduct(product);
      this.stats.imported++; // In SQLite upsert, we count as imported/updated
    } catch (error: any) {
      console.error(`   ❌ DB ERROR for ${product.name}:`, error.message);
      throw error;
    }
    
    // Import additional images if available
    if (product.additional_images && product.additional_images.length > 0) {
      await this.importImages(product.id, product.additional_images);
    }
  }

  private async importImages(productId: string, images: string[]) {
    try {
      await db.insertImages(productId, images);
    } catch (error: any) {
      console.warn(`   ⚠️  Failed to import images for ${productId}:`, error.message);
    }
  }

  private printStats() {
    console.log('\n📈 Import Statistics:');
    console.log(`   Total processed: ${this.stats.total}`);
    console.log(`   ✅ Imported: ${this.stats.imported}`);
    console.log(`   🔄 Updated: ${this.stats.updated}`);
    console.log(`   ⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`   ❌ Validation errors: ${this.stats.validationErrors}`);
    console.log(`   🔄 Duplicates found: ${this.stats.duplicates}`);
    console.log(`   ⚠️  Warnings: ${this.stats.warnings}`);
    console.log(`   ❌ Other errors: ${this.stats.errors}`);
    
    const successCount = this.stats.imported + this.stats.updated;
    const successRate = this.stats.total > 0 
      ? Math.round(successCount / this.stats.total * 100) 
      : 0;
    
    console.log(`   Success rate: ${successRate}%`);
    
    // Duplicate detector stats
    const dupStats = this.duplicateDetector.getStats();
    console.log('\n🔍 Duplicate Detection:');
    console.log(`   Total unique products: ${dupStats.totalProducts}`);
    console.log(`   Exact duplicates: ${dupStats.exactDuplicates}`);
    console.log(`   Similar products: ${dupStats.similarDuplicates}`);
    console.log(`   ID collisions: ${dupStats.idCollisions}`);
  }
}

// Parse command line arguments
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = {};
  
  for (const arg of args) {
    if (arg.startsWith('--file=')) {
      options.file = arg.split('=')[1];
    } else if (arg.startsWith('--brand=')) {
      options.brand = arg.split('=')[1].toUpperCase() as 'IKEA' | 'JYSK';
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }
  
  return options;
}

// Main function
async function main() {
  console.log('🚀 CSV Product Importer for Vybaveno\n');
  
  const options = parseArgs();
  const importer = new CSVImporter();
  
  if (options.dryRun) {
    console.log('🧪 DRY RUN MODE - No data will be written to database\n');
  }
  
  if (options.all) {
    // Import both IKEA and JYSK
    const ikeaPath = path.join(__dirname, '../docs/tmp/ikea-yrx-cz-2026-01-03-2.csv');
    const jyskPath = path.join(__dirname, '../docs/tmp/jysk-cz-2026-01-03-2.csv');
    
    if (fs.existsSync(ikeaPath)) {
      await importer.importFile(ikeaPath, 'IKEA', options);
    } else {
      console.warn(`⚠️  IKEA file not found: ${ikeaPath}`);
    }
    
    if (fs.existsSync(jyskPath)) {
      await importer.importFile(jyskPath, 'JYSK', options);
    } else {
      console.warn(`⚠️  JYSK file not found: ${jyskPath}`);
    }
  } else if (options.file && options.brand) {
    // Import specific file
    const filePath = path.resolve(options.file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    
    await importer.importFile(filePath, options.brand, options);
  } else {
    console.log('Usage:');
    console.log('  npm run import:csv -- --file=path/to/file.csv --brand=IKEA [--limit=100] [--dry-run]');
    console.log('  npm run import:csv -- --all [--limit=100] [--dry-run]');
    process.exit(1);
  }
  
  await db.close();
  console.log('\n✨ Import completed!\n');
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
