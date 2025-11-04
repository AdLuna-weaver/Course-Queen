import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/app/(auth)/actions';
import { sendClaudeMessage } from '@/lib/ai/anthropic';
import { buildRAGContext } from '@/lib/ai/rag';
import { OUTLINE_GENERATION_PROMPT, fillPromptTemplate } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Get course data
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('created_by', user.id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get Phase 1 data from wizard_phases
    const { data: phase1Data } = await supabase
      .from('wizard_phases')
      .select('data')
      .eq('course_id', courseId)
      .eq('phase', 1)
      .single();

    // Get Phase 3 data (writing style) from wizard_phases
    const { data: phase3Data } = await supabase
      .from('wizard_phases')
      .select('data')
      .eq('course_id', courseId)
      .eq('phase', 3)
      .single();

    // Get resources count
    const { count: resourcesCount } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    // Build RAG context from uploaded resources if available
    let ragContext = 'No resources have been uploaded yet.';
    if (resourcesCount && resourcesCount > 0) {
      try {
        const query = `${course.title}. ${course.description}`;
        ragContext = await buildRAGContext(query, courseId, 3000);
      } catch (error) {
        console.error('Error building RAG context:', error);
        ragContext = 'Resources are available but could not be processed at this time.';
      }
    }

    // Prepare variables for prompt template
    const promptVariables = {
      courseTitle: course.title || 'Untitled Course',
      courseDescription: course.description || 'No description provided',
      targetAudience: phase1Data?.data?.targetAudience || 'General audience',
      learningObjectives: Array.isArray(course.outline?.learningObjectives)
        ? course.outline.learningObjectives.join('\n- ')
        : 'No specific objectives defined',
      ragContext,
    };

    // Fill the prompt template
    const userPrompt = fillPromptTemplate(OUTLINE_GENERATION_PROMPT, promptVariables);

    // Add writing style context if available
    let systemPrompt = 'You are an expert instructional designer creating course outlines.';
    if (phase3Data?.data) {
      const writingStyle = phase3Data.data;
      systemPrompt += `\n\nWriting Style Preferences:
- Target Audience Level: ${writingStyle.targetAudienceLevel || 'Not specified'}
- Industry Jargon: ${writingStyle.industryJargon || 'Not specified'}
- Sentence Structure: ${writingStyle.sentenceStructure || 'Not specified'}
- Voice Preference: ${writingStyle.voicePreference || 'Not specified'}
- Examples Preference: ${writingStyle.examplesPreference?.join(', ') || 'Not specified'}
- Formatting Style: ${writingStyle.formattingStyle || 'Not specified'}
- Call-to-Action Style: ${writingStyle.callToActionStyle || 'Not specified'}`;

      if (writingStyle.exampleContent) {
        systemPrompt += `\n\nExample of desired writing style:\n${writingStyle.exampleContent}`;
      }
    }

    // Call Claude to generate outline
    const response = await sendClaudeMessage(
      [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      systemPrompt,
      4096
    );

    // Parse the JSON response
    let outline;
    try {
      // Extract JSON from the response (Claude might wrap it in markdown code blocks)
      const jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response.content;
      outline = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse outline JSON:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse generated outline' },
        { status: 500 }
      );
    }

    // Save cost tracking
    await supabase.from('cost_tracking').insert({
      course_id: courseId,
      operation: 'outline_generation',
      model: 'claude-sonnet-4-20250514',
      tokens_used: response.tokensUsed.total,
      cost: response.cost,
      metadata: {
        inputTokens: response.tokensUsed.input,
        outputTokens: response.tokensUsed.output,
      },
    });

    return NextResponse.json({
      success: true,
      outline,
      tokensUsed: response.tokensUsed,
      cost: response.cost,
    });
  } catch (error: any) {
    console.error('Error generating outline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate outline' },
      { status: 500 }
    );
  }
}
