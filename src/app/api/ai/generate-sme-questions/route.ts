import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/app/(auth)/actions';
import { sendClaudeMessage } from '@/lib/ai/anthropic';
import { SME_QUESTIONS_PROMPT, fillPromptTemplate } from '@/lib/ai/prompts';

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

    // Get course data with outline
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('creator_id', user.id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get team members with SME role
    const { data: smeMembers, error: smeError } = await supabase
      .from('course_team')
      .select('*, profiles!inner(id, email)')
      .eq('course_id', courseId)
      .eq('role', 'SME');

    if (smeError) {
      console.error('Error fetching SME members:', smeError);
      return NextResponse.json(
        { error: 'Failed to fetch SME members' },
        { status: 500 }
      );
    }

    if (!smeMembers || smeMembers.length === 0) {
      return NextResponse.json(
        { error: 'No SME team members found. Please add SMEs in Phase 2.' },
        { status: 400 }
      );
    }

    // Get resources summary
    const { data: resources } = await supabase
      .from('resources')
      .select('name, type')
      .eq('course_id', courseId);

    const resourcesSummary =
      resources && resources.length > 0
        ? resources.map((r) => `${r.name} (${r.type})`).join(', ')
        : 'No resources uploaded';

    // Prepare course outline for prompt
    const courseOutline = course.outline?.modules
      ? JSON.stringify(course.outline.modules, null, 2)
      : 'No outline generated yet';

    // Prepare variables for prompt template
    const promptVariables = {
      courseTitle: course.title || 'Untitled Course',
      courseOutline,
      resourcesSummary,
    };

    // Fill the prompt template
    const userPrompt = fillPromptTemplate(SME_QUESTIONS_PROMPT, promptVariables);

    // Add context about SMEs
    const systemPrompt = `You are an expert instructional designer working with subject matter experts (SMEs).
You have ${smeMembers.length} SME(s) available to provide expert input.

Generate ${Math.min(5, Math.max(3, smeMembers.length * 2))} total questions that will be distributed among the SMEs.
Focus on areas where expert knowledge is most critical for course quality.`;

    // Call Claude to generate questions
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
    let questionsData;
    try {
      const jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response.content;
      questionsData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse questions JSON:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse generated questions' },
        { status: 500 }
      );
    }

    // Distribute questions among SMEs (round-robin)
    const questions = questionsData.questions || [];
    const questionsWithSME = questions.map((q: any, index: number) => {
      const sme = smeMembers[index % smeMembers.length];
      return {
        ...q,
        smeId: sme.user_id,
        smeEmail: sme.profiles.email,
      };
    });

    // Save questions to database
    const questionsToInsert = questionsWithSME.map((q: any) => ({
      course_id: courseId,
      sme_id: q.smeId,
      question: q.question,
      context: q.context,
      category: q.category,
      priority: q.priority,
      target_module: q.targetModule || null,
      status: 'pending',
    }));

    const { data: savedQuestions, error: insertError } = await supabase
      .from('sme_questions')
      .insert(questionsToInsert)
      .select('*, profiles!sme_questions_sme_id_fkey(email)');

    if (insertError) {
      console.error('Error saving questions:', insertError);
      return NextResponse.json(
        { error: 'Failed to save questions' },
        { status: 500 }
      );
    }

    // Save cost tracking
    await supabase.from('cost_tracking').insert({
      course_id: courseId,
      operation: 'sme_questions_generation',
      model: 'claude-sonnet-4-20250514',
      tokens_used: response.tokensUsed.total,
      cost: response.cost,
      metadata: {
        inputTokens: response.tokensUsed.input,
        outputTokens: response.tokensUsed.output,
        questionsGenerated: questions.length,
      },
    });

    return NextResponse.json({
      success: true,
      questions: savedQuestions,
      tokensUsed: response.tokensUsed,
      cost: response.cost,
    });
  } catch (error: any) {
    console.error('Error generating SME questions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate SME questions' },
      { status: 500 }
    );
  }
}
