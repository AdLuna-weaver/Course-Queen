# Database Setup Guide

## Prerequisites

1. Supabase account (free tier works)
2. Project created on [supabase.com](https://supabase.com)
3. Your project credentials added to `.env.local`

## Step 1: Enable pgvector Extension

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Extensions**
3. Search for "vector"
4. Enable the **vector** extension

## Step 2: Run the Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click **Run** (or press Ctrl+Enter)

The migration will create:
- All database tables
- Indexes for performance
- Row Level Security (RLS) policies
- Vector similarity search function
- Triggers for automatic timestamps

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref <your-project-ref>

# Push the migration
supabase db push
```

## Step 3: Verify the Setup

Run this query in the SQL Editor to verify everything was created:

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if vector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if the search function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'search_embeddings';
```

You should see these tables:
- companies
- profiles
- courses
- course_team
- resources
- embeddings
- modules
- lessons
- questions
- comments
- sme_questions
- cost_tracking
- wizard_phases

## Step 4: Seed Sample Data (Optional)

You can run `supabase/seed.sql` to create a sample company:

1. Go to SQL Editor
2. Copy contents of `supabase/seed.sql`
3. Paste and run

**Note:** You'll need to create users through Supabase Auth first, then update the seed file with actual user IDs.

## Step 5: Create Your First User

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add user** → **Create new user**
3. Enter email and password
4. After user is created, note the user ID

Then run this SQL to create a profile:

```sql
INSERT INTO profiles (id, email, company_id, role)
VALUES (
  '<user-id-from-auth>',
  'your-email@example.com',
  '00000000-0000-0000-0000-000000000001',
  'admin'
);
```

## Troubleshooting

### Error: "extension vector does not exist"
- Make sure you enabled the vector extension in Step 1

### Error: "permission denied"
- Check that you're running the migration as the postgres role (default in dashboard)

### Error: "relation already exists"
- Tables already exist. Either drop them first or skip this migration

### RLS Policies Not Working
- Verify policies were created:
  ```sql
  SELECT * FROM pg_policies WHERE schemaname = 'public';
  ```

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access data from their own company
- API calls are automatically filtered by RLS policies
- Use the anon key for client-side calls
- Use the service role key only for admin operations (server-side)

## Next Steps

After setup:
1. Test authentication by signing up at `/signup`
2. Create your first course at `/courses`
3. Upload resources to test the RAG functionality
4. Configure your AI API keys for content generation
