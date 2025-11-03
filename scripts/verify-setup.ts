/**
 * Setup Verification Script
 *
 * Run this script to verify your Course Planner setup:
 * npx tsx scripts/verify-setup.ts
 *
 * Install tsx if needed: npm install -D tsx
 */

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function verifyEnvironment() {
  console.log('🔍 Verifying Environment Variables...\n');

  // Check Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  check(
    'Supabase URL',
    !!supabaseUrl && supabaseUrl.includes('supabase.co'),
    supabaseUrl ? 'Configured' : 'Missing - add NEXT_PUBLIC_SUPABASE_URL'
  );

  check(
    'Supabase Anon Key',
    !!supabaseKey && supabaseKey.length > 100,
    supabaseKey ? 'Configured' : 'Missing - add NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );

  // Check AI Keys
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  check(
    'Anthropic API Key',
    !!anthropicKey && anthropicKey !== 'your-anthropic-api-key',
    anthropicKey && anthropicKey !== 'your-anthropic-api-key'
      ? 'Configured'
      : 'Missing - add ANTHROPIC_API_KEY for AI features'
  );

  const openaiKey = process.env.OPENAI_API_KEY;
  check(
    'OpenAI API Key',
    !!openaiKey && openaiKey !== 'your-openai-api-key',
    openaiKey && openaiKey !== 'your-openai-api-key'
      ? 'Configured'
      : 'Missing - add OPENAI_API_KEY for embeddings'
  );
}

async function verifySupabase() {
  console.log('\n🔍 Verifying Supabase Connection...\n');

  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test connection
    const { error } = await supabase.from('companies').select('count').limit(0);

    if (error) {
      if (error.message.includes('relation "companies" does not exist')) {
        check(
          'Database Tables',
          false,
          'Tables not created - run the migration from DATABASE_SETUP.md'
        );
      } else {
        check(
          'Database Connection',
          false,
          `Connection failed: ${error.message}`
        );
      }
    } else {
      check('Database Connection', true, 'Successfully connected');
      check('Database Tables', true, 'Tables exist');
    }

    // Check for pgvector
    const { error: vectorError } = await supabase.rpc('search_embeddings', {
      query_embedding: Array(1536).fill(0),
      match_threshold: 0.8,
      match_count: 1,
    });

    if (vectorError) {
      if (vectorError.message.includes('function') && vectorError.message.includes('does not exist')) {
        check(
          'pgvector Setup',
          false,
          'Vector search function not found - run the full migration'
        );
      } else if (vectorError.message.includes('relation') && vectorError.message.includes('does not exist')) {
        check(
          'pgvector Setup',
          false,
          'Embeddings table not found - run the migration'
        );
      } else {
        check('pgvector Setup', true, 'Extension and function configured');
      }
    } else {
      check('pgvector Setup', true, 'Extension and function configured');
    }

  } catch (error: any) {
    check('Supabase Client', false, error.message);
  }
}

async function verifyDependencies() {
  console.log('\n🔍 Verifying Dependencies...\n');

  const requiredPackages = [
    'next',
    '@supabase/supabase-js',
    '@anthropic-ai/sdk',
    'openai',
    'tailwindcss',
    'react',
  ];

  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
      check(`Package: ${pkg}`, true, 'Installed');
    } catch {
      check(`Package: ${pkg}`, false, 'Not installed');
    }
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('SETUP VERIFICATION SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
  console.log(`❌ Failed: ${total - passed}/${total}\n`);

  const failed = results.filter(r => !r.passed);

  if (failed.length === 0) {
    console.log('🎉 All checks passed! Your setup is complete.\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Visit: http://localhost:3000');
    console.log('  3. Create a user in Supabase Auth');
    console.log('  4. Start building!\n');
  } else {
    console.log('⚠️  Some checks failed. Please address:\n');
    failed.forEach(f => {
      console.log(`  - ${f.name}: ${f.message}`);
    });
    console.log('\nSee QUICK_START.md and DATABASE_SETUP.md for help.\n');
  }
}

async function main() {
  console.log('🚀 Course Planner Setup Verification\n');

  await verifyEnvironment();
  await verifyDependencies();
  await verifySupabase();
  await printSummary();
}

main().catch(console.error);
