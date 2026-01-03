#!/usr/bin/env tsx
/**
 * Validate CSV products before import
 * Runs validation and duplicate detection without importing
 */

import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path';
import { ProductParser } from './parsers/product-parser';
import { validateBatch } from './validators/product-validator';
import { detectDuplicates } from './validators/duplicate-detector';
import type { CSVRow } from './types';

interface ValidateOptions {
  file: string;
  brand: 'IKEA' | 'JYSK';
  limit?: number;
  showWarnings?: boolean;
  saveClean?: boolean;
}

async function validateCSV(options: ValidateOptions) {
  console.log(`\n🔍 Validating CSV: ${options.file}`);
  console.log(`   Brand: ${options.brand}\n`);

  // Read CSV
  const fileContent = fs.readFileSync(options.file, 'utf-8');
  const rows: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const limit = options.limit || rows.length;
  const rowsToProcess = rows.slice(0, limit);
  
  console.log(`📊 Processing ${rowsToProcess.length} rows...\n`);

  // Parse products
  const parser = new ProductParser(options.brand);
  const products: any[] = [];
  let skippedCount = 0;

  for (const row of rowsToProcess) {
    const product = parser.parse(row);
    if (product) {
      products.push(product);
    } else {
      skippedCount++;
      if (options.showWarnings) {
        console.log(`⚠️  Skipped row: ${row.data2 || row.name || 'Unknown'} (Missing name, price or image)`);
      }
    }
  }

  console.log(`✅ Successfully parsed ${products.length}/${rowsToProcess.length} products (${skippedCount} skipped)\n`);

  // STEP 1: Validation
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: Data Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const validationResult = validateBatch(products);

  console.log('📊 Validation Results:');
  console.log(`   Total products: ${validationResult.stats.total}`);
  console.log(`   ✅ Valid: ${validationResult.stats.valid}`);
  console.log(`   ❌ Invalid: ${validationResult.stats.invalid}`);
  console.log(`   ⚠️  With warnings: ${validationResult.stats.withWarnings}`);

  // Show invalid products
  if (validationResult.invalid.length > 0) {
    console.log(`❌ Invalid Products (showing first 10):\n`);
    
    validationResult.invalid.slice(0, 10).forEach(({ product, result }, idx) => {
      console.log(`${idx + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      result.errors.forEach(err => {
        console.log(`   ❌ ${err.field}: ${err.message}`);
        console.log(`      Value: ${JSON.stringify(err.value)}`);
      });
      console.log('');
    });
  }

  // Analyze and show warnings
  if (validationResult.stats.withWarnings > 0) {
    const warningSummary: Record<string, number> = {};
    validationResult.valid.forEach(({ result }) => {
      result.warnings.forEach(w => {
        const key = `${w.field}: ${w.message}`;
        warningSummary[key] = (warningSummary[key] || 0) + 1;
      });
    });

    console.log('⚠️  Warning Summary (all products):');
    Object.entries(warningSummary)
      .sort((a, b) => b[1] - a[1])
      .forEach(([msg, count]) => {
        console.log(`   - ${count}x ${msg}`);
      });
    console.log('');

    if (options.showWarnings) {
      console.log('⚠️  Sample Products with Warnings (showing first 10):\n');
      let warningCount = 0;
      for (const { product, result } of validationResult.valid) {
        if (result.warnings.length > 0) {
          console.log(`${warningCount + 1}. ${product.name}`);
          result.warnings.forEach(w => {
            console.log(`   ⚠️  ${w.field}: ${w.message}`);
          });
          console.log('');
          
          warningCount++;
          if (warningCount >= 10) break;
        }
      }
    }
  }

  // STEP 2: Duplicate Detection
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: Duplicate Detection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const validProductsOnly = validationResult.valid.map(v => v.product);
  const duplicateResult = detectDuplicates(validProductsOnly);

  const exactCount = duplicateResult.stats.exactDuplicates + duplicateResult.stats.idCollisions;
  const similarCount = duplicateResult.stats.similarDuplicates;

  console.log('🔍 Duplicate Detection Results:');
  console.log(`   Unique products: ${duplicateResult.unique.length}`);
  console.log(`   Merged (EXACT): ${exactCount}`);
  if (similarCount > 0) {
    console.log(`   Similar (>=94%): ${similarCount}`);
  }

  if (similarCount > 0) {
    console.log(`\n🔄 Similar Products (>=94%) - showing first 10:\n`);
    
    duplicateResult.duplicates
      .filter(d => d.type === 'similar')
      .slice(0, 10)
      .forEach((dup, idx) => {
        console.log(`${idx + 1}. Similarity: ${Math.round(dup.similarity * 100)}%`);
        console.log(`   Product 1: ${dup.product1.name}`);
        console.log(`   Product 2: ${dup.product2.name}`);
        console.log(`   Reason: ${dup.reason}`);
        console.log('');
      });
  }

  // FINAL SUMMARY
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 FINAL SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const canImport = validationResult.stats.invalid === 0;

  if (canImport) {
    console.log('✅ CSV is ready for import!');
    console.log(`   ${duplicateResult.unique.length} unique products will be imported`);
    console.log(`   ${exactCount} exact duplicates were merged`);
    if (similarCount > 0) {
      console.log(`   ${similarCount} similar products (>=94%) were skipped`);
    }

    // Save cleaned CSV if requested
    if (options.saveClean) {
      const outputPath = options.file.replace('.csv', '_cleaned.csv');
      
      // Flatten dimensions for CSV
      const csvData = duplicateResult.unique.map(p => ({
        ...p,
        dimensions_cm: p.dimensions_cm ? JSON.stringify(p.dimensions_cm) : '',
        additional_images: p.additional_images ? p.additional_images.join(',') : '',
        search_keywords: p.search_keywords ? p.search_keywords.join(',') : ''
      }));

      const output = stringify(csvData, { header: true });
      fs.writeFileSync(outputPath, output);
      console.log(`\n💾 Cleaned CSV saved to: ${outputPath}`);
    }
  } else {
    console.log('❌ CSV has issues that must be fixed before import:');
    if (validationResult.stats.invalid > 0) {
      console.log(`   - ${validationResult.stats.invalid} products have validation errors`);
    }
  }

  console.log('');
  process.exit(canImport ? 0 : 1);
}

// Parse arguments
const args = process.argv.slice(2);
const options: ValidateOptions = {
  file: '',
  brand: 'IKEA',
};

for (const arg of args) {
  if (arg.startsWith('--file=')) {
    options.file = arg.split('=')[1];
  } else if (arg.startsWith('--brand=')) {
    options.brand = arg.split('=')[1].toUpperCase() as 'IKEA' | 'JYSK';
  } else if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--show-warnings' || arg === '--showWarnings') {
    options.showWarnings = true;
  } else if (arg === '--save-clean' || arg === '--saveClean') {
    options.saveClean = true;
  }
}

if (!options.file) {
  console.log('Usage:');
  console.log('  npm run validate:csv -- --file=path/to/file.csv --brand=IKEA [--limit=100] [--show-warnings] [--save-clean]');
  process.exit(1);
}

validateCSV(options).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
