-- Seed data for development

-- Insert a test company
INSERT INTO companies (id, name, branding_settings) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Company', '{
    "primaryColor": "#3B82F6",
    "secondaryColor": "#10B981",
    "logo": "/logo.png"
  }');

-- Note: Users must be created through Supabase Auth
-- This seed file assumes you'll create test users manually
-- After creating users, you can add profiles:

-- Example profile insert (uncomment and update with real user ID from auth.users)
-- INSERT INTO profiles (id, email, company_id, role) VALUES
--   ('user-id-from-auth', 'demo@example.com', '00000000-0000-0000-0000-000000000001', 'admin');

-- Insert a demo course
-- INSERT INTO courses (id, title, description, company_id, creator_id, status) VALUES
--   ('00000000-0000-0000-0000-000000000002',
--    'Introduction to Web Development',
--    'A comprehensive course covering HTML, CSS, and JavaScript fundamentals',
--    '00000000-0000-0000-0000-000000000001',
--    'user-id-from-auth',
--    'draft');
