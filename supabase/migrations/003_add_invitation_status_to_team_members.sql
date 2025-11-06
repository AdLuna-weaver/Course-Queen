-- Add invitation status tracking to course_team_members table
-- This allows tracking whether team members have accepted their invitations

-- Add invitation_status column with check constraint
ALTER TABLE course_team_members
ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'invited'
CHECK (invitation_status IN ('invited', 'accepted', 'declined'));

-- Add invited_at timestamp (defaults to NOW when record is created)
ALTER TABLE course_team_members
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add accepted_at timestamp (null until user accepts invitation)
ALTER TABLE course_team_members
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on invitation status
CREATE INDEX IF NOT EXISTS idx_course_team_members_invitation_status
ON course_team_members(invitation_status);

-- Add comment explaining the invitation flow
COMMENT ON COLUMN course_team_members.invitation_status IS
'Status of team member invitation: invited (default), accepted, or declined';

COMMENT ON COLUMN course_team_members.invited_at IS
'Timestamp when the team member was invited';

COMMENT ON COLUMN course_team_members.accepted_at IS
'Timestamp when the team member accepted the invitation (null if not yet accepted)';
