'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/app/(auth)/actions';

export interface CreateCourseData {
  title: string;
  description: string;
  targetAudience?: string;
  learningObjectives: string[];
  estimatedDuration: number;
  deliveryFormat: string;
  priority: string;
}

export interface CourseResponse {
  success: boolean;
  courseId?: string;
  error?: string;
}

export async function createCourse(data: CreateCourseData): Promise<CourseResponse> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Create the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: data.title,
        description: data.description,
        created_by: user.id,
        company_id: user.user_metadata?.company_id || null,
        status: 'draft',
        current_phase: 1,
        outline: {
          learningObjectives: data.learningObjectives,
          modules: [],
        },
      })
      .select()
      .single();

    if (courseError) {
      console.error('Course creation error:', courseError);
      return { success: false, error: courseError.message };
    }

    // Save Phase 1 wizard data
    const { error: wizardError } = await supabase.from('wizard_phases').insert({
      course_id: course.id,
      phase: 1,
      title: 'Course Idea',
      description: 'Define your course concept',
      completed: true,
      data: {
        title: data.title,
        description: data.description,
        targetAudience: data.targetAudience,
        learningObjectives: data.learningObjectives,
        estimatedDuration: data.estimatedDuration,
        deliveryFormat: data.deliveryFormat,
        priority: data.priority,
      },
    });

    if (wizardError) {
      console.error('Wizard phase error:', wizardError);
      // Don't fail the whole operation, just log it
    }

    revalidatePath('/courses');
    return { success: true, courseId: course.id };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message || 'Failed to create course' };
  }
}

export async function updateWizardPhase(
  courseId: string,
  phase: number,
  data: any,
  completed: boolean = false
): Promise<{ success: boolean; error?: string }> {
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

    if (courseError || !course) {
      return { success: false, error: 'Course not found' };
    }

    if (course.created_by !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Upsert wizard phase data
    const { error } = await supabase.from('wizard_phases').upsert({
      course_id: courseId,
      phase,
      completed,
      data,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Update course current_phase if completed
    if (completed) {
      await supabase
        .from('courses')
        .update({ current_phase: phase + 1 })
        .eq('id', courseId);
    }

    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update wizard phase' };
  }
}

export async function getCourse(courseId: string) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error || !course) {
    redirect('/courses');
  }

  // Verify access
  if (course.created_by !== user.id) {
    redirect('/courses');
  }

  return course;
}

export async function getWizardPhase(courseId: string, phase?: number) {
  const supabase = await createClient();

  if (phase) {
    // Get specific phase
    const { data, error } = await supabase
      .from('wizard_phases')
      .select('*')
      .eq('course_id', courseId)
      .eq('phase', phase)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  // Get all phases and construct wizard state
  const { data: phases, error } = await supabase
    .from('wizard_phases')
    .select('*')
    .eq('course_id', courseId)
    .order('phase', { ascending: true });

  if (error || !phases) {
    return {
      current_phase: 1,
      completed_phases: [],
    };
  }

  const completedPhases = phases.filter(p => p.completed).map(p => p.phase);
  const currentPhase = Math.max(...completedPhases, 0) + 1;

  return {
    current_phase: currentPhase > 7 ? 7 : currentPhase,
    completed_phases: completedPhases,
    phases: phases.reduce((acc, p) => {
      acc[`phase_${p.phase}_data`] = p.data;
      return acc;
    }, {} as Record<string, any>),
  };
}
