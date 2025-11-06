/**
 * Script to apply migrations to Supabase database
 *
 * This script will:
 * 1. Read all migration files
 * 2. Apply them in order to your Supabase database
 * 3. Verify the schema is correct
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log('🚀 Starting migration process...\n');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  // Read all migration files
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Ensure they're applied in order

  console.log(`📂 Found ${files.length} migration file(s):\n`);

  for (const file of files) {
    console.log(`  📄 ${file}`);
  }
  console.log();

  // Apply each migration
  for (const file of files) {
    console.log(`⏳ Applying ${file}...`);

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

      if (error) {
        console.error(`❌ Error applying ${file}:`, error.message);

        // If exec_sql function doesn't exist, provide instructions
        if (error.message.includes('exec_sql')) {
          console.log('\n⚠️  The exec_sql function is not available.');
          console.log('You need to apply migrations through the Supabase Dashboard:\n');
          console.log('1. Go to https://app.supabase.com');
          console.log('2. Select your project');
          console.log('3. Go to SQL Editor');
          console.log('4. Copy and paste the content of each migration file');
          console.log('5. Run them in order\n');
          console.log(`Migration files location: ${migrationsDir}\n`);
          process.exit(1);
        }
      } else {
        console.log(`✅ Applied ${file} successfully\n`);
      }
    } catch (err: any) {
      console.error(`❌ Failed to apply ${file}:`, err.message);
    }
  }

  console.log('✅ Migration process complete!\n');

  // Verify resources table
  await verifyResourcesTable();
}

async function verifyResourcesTable() {
  console.log('🔍 Verifying resources table schema...\n');

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .limit(0);

  if (error) {
    console.error('❌ Error querying resources table:', error.message);
    if (error.message.includes('relation "resources" does not exist')) {
      console.log('\n⚠️  The resources table does not exist!');
      console.log('Please apply the migrations through the Supabase Dashboard.\n');
    }
    return;
  }

  console.log('✅ Resources table exists and is accessible\n');

  // Try to check column existence
  const { data: testData, error: testError } = await supabase
    .from('resources')
    .select('name, type, url, metadata, uploaded_at, uploaded_by')
    .limit(1);

  if (testError) {
    console.error('❌ Schema verification failed:', testError.message);
    console.log('\n⚠️  Some required columns may be missing.');
    console.log('Please run migration 002_fix_resources_table.sql through the Supabase Dashboard.\n');
  } else {
    console.log('✅ All required columns are present!\n');
  }
}

// Run the script
applyMigrations().catch(console.error);
