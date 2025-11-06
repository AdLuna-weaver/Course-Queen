# Fix: Phase 2 Resources Table Error

## Problem
Error: "Could not find the 'name' column of 'resources' in the schema cache"

This means your Supabase database hasn't been properly migrated with the correct schema.

## Solution: Apply Migrations Manually

Since this is the most reliable method, follow these steps:

### Step 1: Open Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Apply Migration 001 (Initial Schema)

Copy the entire content of `supabase/migrations/001_initial_schema.sql` and paste it into the SQL Editor.

Click **Run** to execute.

### Step 3: Apply Migration 002 (Fix Resources Table)

Copy the entire content of `supabase/migrations/002_fix_resources_table.sql` and paste it into the SQL Editor.

Click **Run** to execute.

This migration is **idempotent** - it can be run multiple times safely. It will only add missing columns.

### Step 4: Verify the Fix

Run this query in the SQL Editor to verify all columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;
```

You should see these columns:
- `id` (uuid)
- `course_id` (uuid)
- `name` (text) ← **This is the missing column**
- `type` (text)
- `url` (text)
- `uploaded_by` (uuid)
- `metadata` (jsonb)
- `uploaded_at` (timestamp with time zone)

### Step 5: Test Phase 2

1. Refresh your application
2. Navigate to a course's Phase 2
3. Try uploading a resource
4. The error should be gone!

## Alternative: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Or apply specific migration
supabase db execute --file supabase/migrations/002_fix_resources_table.sql
```

## Need Help?

If you're still seeing errors after applying migrations:

1. Check the Supabase Dashboard > Database > Schema to visually inspect the tables
2. Try running the verification script:
   ```bash
   npm run verify-setup
   ```
3. Check for any error messages in the Supabase Dashboard > Logs

## What Caused This?

The initial database setup may have been incomplete, or migrations weren't applied after cloning the repository. This fix ensures your database schema matches what the application expects.
