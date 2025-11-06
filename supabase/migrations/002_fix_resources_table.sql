-- Fix resources table to ensure 'name' column exists
-- This migration is idempotent and can be run multiple times safely

-- Check if name column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'resources'
    AND column_name = 'name'
  ) THEN
    ALTER TABLE resources ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Resource';

    -- Remove the default after adding the column
    ALTER TABLE resources ALTER COLUMN name DROP DEFAULT;
  END IF;
END $$;

-- Ensure the resources table has all required columns
-- This will not fail if columns already exist

DO $$
BEGIN
  -- Add type column if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'resources'
    AND column_name = 'type'
  ) THEN
    ALTER TABLE resources ADD COLUMN type TEXT NOT NULL DEFAULT 'pdf'
      CHECK (type IN ('pdf', 'docx', 'xlsx', 'video', 'url'));
    ALTER TABLE resources ALTER COLUMN type DROP DEFAULT;
  END IF;

  -- Add url column if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'resources'
    AND column_name = 'url'
  ) THEN
    ALTER TABLE resources ADD COLUMN url TEXT NOT NULL DEFAULT '';
    ALTER TABLE resources ALTER COLUMN url DROP DEFAULT;
  END IF;

  -- Add uploaded_by column if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'resources'
    AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE resources ADD COLUMN uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- Add metadata column if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'resources'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE resources ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add uploaded_at column if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'resources'
    AND column_name = 'uploaded_at'
  ) THEN
    ALTER TABLE resources ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Ensure the check constraint exists on type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resources_type_check'
  ) THEN
    ALTER TABLE resources ADD CONSTRAINT resources_type_check
      CHECK (type IN ('pdf', 'docx', 'xlsx', 'video', 'url'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
