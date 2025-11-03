import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/app/(auth)/actions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { outline } = await request.json();
    const courseId = params.id;

    if (!courseId || !outline) {
      return NextResponse.json(
        { error: 'Course ID and outline are required' },
        { status: 400 }
      );
    }

    // Verify user owns this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, creator_id')
      .eq('id', courseId)
      .eq('creator_id', user.id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Update course outline
    const { error: updateError } = await supabase
      .from('courses')
      .update({ outline })
      .eq('id', courseId);

    if (updateError) {
      console.error('Error updating outline:', updateError);
      return NextResponse.json(
        { error: 'Failed to update outline' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in outline update:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update outline' },
      { status: 500 }
    );
  }
}
