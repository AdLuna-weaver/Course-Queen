'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/app/(auth)/actions';

// File Upload Actions
export async function uploadResource(formData: FormData): Promise<{
  success: boolean;
  resource?: any;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const courseId = formData.get('courseId') as string;
    const file = formData.get('file') as File;

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Verify user owns this course
    const { data: course } = await supabase
      .from('courses')
      .select('id, created_by, company_id')
      .eq('id', courseId)
      .single();

    if (!course || course.created_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${courseId}/${timestamp}-${random}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-resources')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-resources')
      .getPublicUrl(fileName);

    // Save metadata to database
    const { data: resource, error: dbError } = await supabase
      .from('resources')
      .insert({
        course_id: courseId,
        company_id: course.company_id,
        file_name: file.name,
        file_type: fileExt || 'unknown',
        file_url: publicUrl,
        file_size_bytes: file.size,
        uploaded_by: user.id,
        extraction_status: 'pending',
        metadata: {
          originalName: file.name,
          contentType: file.type,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return { success: false, error: dbError.message };
    }

    revalidatePath(`/courses/${courseId}`);
    return { success: true, resource };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message || 'Failed to upload resource' };
  }
}

export async function deleteResource(resourceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get resource and verify ownership
    const { data: resource, error: fetchError } = await supabase
      .from('resources')
      .select('*, courses!inner(created_by)')
      .eq('id', resourceId)
      .single();

    if (fetchError || !resource) {
      return { success: false, error: 'Resource not found' };
    }

    if ((resource as any).courses.created_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Extract file path from URL
    const urlParts = resource.file_url.split('/');
    const filePath = urlParts.slice(-2).join('/'); // courseId/filename

    // Delete from storage
    await supabase.storage
      .from('course-resources')
      .remove([filePath]);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath(`/courses/${resource.course_id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete resource' };
  }
}

export async function getResources(courseId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('course_id', courseId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching resources:', error);
    return [];
  }

  return data || [];
}

// Team Management Actions
export async function addTeamMember(
  courseId: string,
  email: string,
  role: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Verify user owns this course
    const { data: course } = await supabase
      .from('courses')
      .select('id, created_by, title')
      .eq('id', courseId)
      .single();

    if (!course || course.created_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if this email is already invited to this course
    const { data: existing } = await supabase
      .from('course_team_members')
      .select('id, invitation_status')
      .eq('course_id', courseId)
      .eq('invited_email', email)
      .single();

    if (existing) {
      if (existing.invitation_status === 'accepted') {
        return { success: false, error: 'User is already a team member' };
      } else {
        return { success: false, error: 'User already has a pending invitation' };
      }
    }

    // Try to find user by email (they might already have an account)
    const { data: member } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    // Generate invitation token
    const invitationToken = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Add to team - works whether user exists or not
    const { error: insertError } = await supabase
      .from('course_team_members')
      .insert({
        course_id: courseId,
        user_id: member?.id || null, // null if user doesn't exist yet
        invited_email: email,
        role,
        invitation_status: member?.id ? 'accepted' : 'invited', // Auto-accept if user exists
        invitation_token: invitationToken,
        invited_at: new Date().toISOString(),
        accepted_at: member?.id ? new Date().toISOString() : null,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    // TODO: Send invitation email here (we'll add this later)
    // await sendInvitationEmail(email, course.title, invitationToken);

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      message: member?.id
        ? 'User added to team'
        : 'Invitation sent - user will be added when they sign up'
    };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message || 'Failed to add team member' };
  }
}

export async function removeTeamMember(
  courseId: string,
  teamMemberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Verify user owns this course
    const { data: course } = await supabase
      .from('courses')
      .select('id, created_by')
      .eq('id', courseId)
      .single();

    if (!course || course.created_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Remove from team by team member id
    const { error } = await supabase
      .from('course_team_members')
      .delete()
      .eq('id', teamMemberId)
      .eq('course_id', courseId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to remove team member' };
  }
}

export async function getTeamMembers(courseId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('course_team_members')
    .select('id, user_id, invited_email, role, invitation_status, invited_at, accepted_at, profiles(id, email)')
    .eq('course_id', courseId)
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }

  // Transform data to always show email and status
  return (data || []).map(member => {
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    return {
      ...member,
      email: profile?.email || member.invited_email,
      status: member.invitation_status || 'invited',
    };
  });
}
