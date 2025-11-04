import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/app/(auth)/actions';
import { sendClaudeMessage } from '@/lib/ai/anthropic';
import { buildRAGContext } from '@/lib/ai/rag';
import { CONTENT_GENERATION_PROMPT, fillPromptTemplate } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { courseId, moduleIndex } = await request.json();

    if (!courseId || moduleIndex === undefined) {
      return NextResponse.json(
        { error: 'Course ID and module index are required' },
        { status: 400 }
      );
    }

    // Get course data with outline
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('created_by', user.id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get the specific module from outline
    const modules = course.outline?.modules || [];
    if (moduleIndex >= modules.length) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const module = modules[moduleIndex];

    // Get Phase 3 data (branding and writing style)
    const { data: phase3Data } = await supabase
      .from('wizard_phases')
      .select('data')
      .eq('course_id', courseId)
      .eq('phase', 3)
      .single();

    // Build RAG context from uploaded resources
    let ragContext = 'No additional resources available.';
    try {
      const query = `${module.title}. ${module.description}. Key topics: ${module.lessons?.map((l: any) => l.title).join(', ')}`;
      ragContext = await buildRAGContext(query, courseId, 4000);
    } catch (error) {
      console.error('Error building RAG context:', error);
    }

    // Get SME answers related to this module (if any)
    const { data: smeAnswers } = await supabase
      .from('sme_questions')
      .select('question, answer, context')
      .eq('course_id', courseId)
      .eq('status', 'answered')
      .ilike('target_module', `%${module.title}%`);

    let smeContext = '';
    if (smeAnswers && smeAnswers.length > 0) {
      smeContext = smeAnswers
        .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}\nContext: ${qa.context}`)
        .join('\n\n');
    }

    // Prepare branding guidelines
    let brandingGuidelines = '';
    if (course.custom_branding) {
      const branding = course.custom_branding;
      brandingGuidelines = `Brand Colors: Primary ${branding.primaryColor}, Secondary ${branding.secondaryColor}
Fonts: Headings in ${branding.headingFont}, Body in ${branding.bodyFont}`;
    }

    if (phase3Data?.data) {
      const style = phase3Data.data;
      brandingGuidelines += `\n\nWriting Style:
- Target Audience: ${style.targetAudienceLevel || 'General'}
- Jargon Usage: ${style.industryJargon || 'Balanced'}
- Sentence Structure: ${style.sentenceStructure || 'Conversational'}
- Voice: ${style.voicePreference || 'Active'}
- Examples: ${style.examplesPreference?.join(', ') || 'Mixed'}
- Formatting: ${style.formattingStyle || 'Mixed'}
- Call-to-Action: ${style.callToActionStyle || 'Direct'}`;

      if (style.exampleContent) {
        brandingGuidelines += `\n\nExample Writing:\n${style.exampleContent}`;
      }
    }

    // Prepare prompt variables
    const promptVariables = {
      moduleTitle: module.title,
      lessonTitle: module.lessons?.[0]?.title || module.title,
      lessonDescription: module.description,
      keyTopics: module.lessons?.map((l: any) => l.title).join(', ') || 'General topics',
      duration: module.estimatedDuration,
      brandingGuidelines,
      ragContext: ragContext + (smeContext ? `\n\nSME Input:\n${smeContext}` : ''),
    };

    // Fill the prompt template
    const userPrompt = fillPromptTemplate(CONTENT_GENERATION_PROMPT, promptVariables);

    const systemPrompt = `You are an expert instructional content creator. Generate comprehensive, engaging course content that follows the provided branding guidelines and incorporates the reference materials.

Format the response as valid JSON with the structure specified in the prompt.`;

    // Call Claude to generate content
    const response = await sendClaudeMessage(
      [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      systemPrompt,
      8192 // Larger token limit for content generation
    );

    // Parse the JSON response
    let contentData;
    try {
      const jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response.content;
      contentData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse content JSON:', parseError);
      // If parsing fails, return the raw content
      contentData = {
        introduction: response.content,
        sections: [],
        keyTakeaways: [],
        suggestedMedia: [],
      };
    }

    // Save generated content to database
    // Create or update module record
    const { data: existingModule } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId)
      .eq('order', moduleIndex + 1)
      .single();

    if (existingModule) {
      // Update existing module
      await supabase
        .from('modules')
        .update({
          content: contentData,
          status: 'completed',
          word_count: JSON.stringify(contentData).length / 5, // Rough word count estimate
        })
        .eq('id', existingModule.id);
    } else {
      // Insert new module
      await supabase.from('modules').insert({
        course_id: courseId,
        title: module.title,
        description: module.description,
        order: moduleIndex + 1,
        content: contentData,
        status: 'completed',
        estimated_duration: module.estimatedDuration,
        word_count: JSON.stringify(contentData).length / 5,
      });
    }

    // Save cost tracking
    await supabase.from('cost_tracking').insert({
      course_id: courseId,
      operation: 'content_generation',
      model: 'claude-sonnet-4-20250514',
      tokens_used: response.tokensUsed.total,
      cost: response.cost,
      metadata: {
        moduleTitle: module.title,
        moduleIndex,
        inputTokens: response.tokensUsed.input,
        outputTokens: response.tokensUsed.output,
      },
    });

    return NextResponse.json({
      success: true,
      content: contentData,
      moduleTitle: module.title,
      tokensUsed: response.tokensUsed,
      cost: response.cost,
    });
  } catch (error: any) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
