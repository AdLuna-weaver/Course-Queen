-- Modify course_team_members to support email invitations
-- Make user_id nullable so we can invite people without accounts
ALTER TABLE course_team_members
ALTER COLUMN user_id DROP NOT NULL;

-- Add email column to store invited email addresses
ALTER TABLE course_team_members
ADD COLUMN IF NOT EXISTS invited_email TEXT;

-- Add invitation token for accepting invitations
ALTER TABLE course_team_members
ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE;

-- Update the unique constraint to allow multiple invitations to same email for different courses
DROP INDEX IF EXISTS course_team_members_course_id_user_id_role_key;

-- Create new unique constraint: one invitation per email per course
CREATE UNIQUE INDEX course_team_members_course_email_unique
ON course_team_members(course_id, invited_email)
WHERE user_id IS NULL;

-- Create index for faster lookups
CREATE INDEX idx_course_team_members_email ON course_team_members(invited_email);
CREATE INDEX idx_course_team_members_token ON course_team_members(invitation_token);

-- Update RLS policies to allow viewing by email
DROP POLICY IF EXISTS "Users can view team members for their courses" ON course_team_members;

CREATE POLICY "Users can view team members for their courses"
ON course_team_members FOR SELECT
TO authenticated
USING (
  course_id IN (
    SELECT id FROM courses WHERE created_by = auth.uid()
  )
  OR user_id = auth.uid()
  OR invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
);
