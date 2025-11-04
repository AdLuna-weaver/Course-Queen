'use server';

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/app/(auth)/actions';

export interface BrandingData {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  headingFont: string;
  bodyFont: string;
}

export async function uploadLogo(formData: FormData): Promise<{
  success: boolean;
  logoUrl?: string;
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

    if (!file || !courseId) {
      return { success: false, error: 'Missing file or course ID' };
    }

    // Verify user owns this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, created_by')
      .eq('id', courseId)
      .single();

    if (courseError || !course || course.created_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(7);
    const fileName = `logos/${courseId}/${timestamp}-${random}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-resources')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('course-resources').getPublicUrl(fileName);

    return { success: true, logoUrl: publicUrl };
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return { success: false, error: error.message || 'Failed to upload logo' };
  }
}

export async function saveBranding(
  courseId: string,
  brandingData: BrandingData
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Verify user owns this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, created_by')
      .eq('id', courseId)
      .single();

    if (courseError || !course || course.created_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update course with branding data
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        custom_branding: brandingData,
      })
      .eq('id', courseId);

    if (updateError) {
      console.error('Update error:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Save branding error:', error);
    return { success: false, error: error.message || 'Failed to save branding' };
  }
}

export async function getBranding(courseId: string): Promise<BrandingData | null> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return null;
  }

  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('custom_branding')
      .eq('id', courseId)
      .single();

    if (error || !course) {
      return null;
    }

    return course.custom_branding as BrandingData;
  } catch (error) {
    console.error('Get branding error:', error);
    return null;
  }
}
