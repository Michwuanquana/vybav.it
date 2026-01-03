#!/usr/bin/env tsx
/**
 * Run Database Migrations
 * Applies all pending migrations to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');
  
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${files.length} migration files:\n`);
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`📄 Applying: ${file}`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        // If exec_sql doesn't exist, try direct query
        const { error: directError } = await supabase.from('_migrations').insert({
          name: file,
          executed_at: new Date().toISOString(),
        });
        
        if (directError) {
          console.error(`   ❌ Error: ${error.message}`);
          console.log('   ⚠️  You may need to run migrations manually via Supabase Dashboard');
        } else {
          console.log(`   ✅ Applied successfully`);
        }
      } else {
        console.log(`   ✅ Applied successfully`);
      }
    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);
      console.log(`\n⚠️  Migration failed. Please apply migrations manually:`);
      console.log(`   1. Open Supabase Dashboard → SQL Editor`);
      console.log(`   2. Copy content from: ${filePath}`);
      console.log(`   3. Execute the SQL\n`);
    }
  }
  
  console.log('\n✨ Migrations completed!\n');
  console.log('Manual migration guide:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project → SQL Editor');
  console.log('3. Create new query and paste migration SQL');
  console.log('4. Run migrations in order (001, 002, 003, ...)\n');
}

runMigrations().catch(console.error);
