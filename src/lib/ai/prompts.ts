// AI Prompt templates for different phases of course generation

export const OUTLINE_GENERATION_PROMPT = `You are an expert instructional designer. Based on the provided information, create a comprehensive course outline.

Course Title: {{courseTitle}}
Description: {{courseDescription}}
Target Audience: {{targetAudience}}
Learning Objectives: {{learningObjectives}}

Additional Context from Resources:
{{ragContext}}

Please generate a detailed course outline with:
1. Modules (3-7 modules recommended)
2. Lessons within each module (2-5 lessons per module)
3. Estimated duration for each module and lesson
4. Learning objectives for each module
5. Key topics to cover in each lesson

Format the response as a JSON object with this structure:
{
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "order": 1,
      "estimatedDuration": 60,
      "learningObjectives": ["objective 1", "objective 2"],
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Lesson description",
          "order": 1,
          "estimatedDuration": 15,
          "keyTopics": ["topic 1", "topic 2"]
        }
      ]
    }
  ]
}`;

export const CONTENT_GENERATION_PROMPT = `You are an expert instructional designer and content creator. Generate engaging and educational content for the following lesson.

Module: {{moduleTitle}}
Lesson: {{lessonTitle}}
Description: {{lessonDescription}}
Key Topics: {{keyTopics}}
Target Duration: {{duration}} minutes

Branding Guidelines:
{{brandingGuidelines}}

Reference Materials:
{{ragContext}}

Please generate:
1. Introduction (2-3 paragraphs)
2. Main content sections (well-structured with headings)
3. Examples and case studies
4. Key takeaways (bullet points)
5. Suggested media (images, videos, diagrams) with descriptions

Format the response as a JSON object with this structure:
{
  "introduction": "...",
  "sections": [
    {
      "heading": "Section Title",
      "content": "Section content...",
      "examples": ["example 1", "example 2"]
    }
  ],
  "keyTakeaways": ["takeaway 1", "takeaway 2"],
  "suggestedMedia": [
    {
      "type": "image",
      "description": "Description of what the image should show",
      "placement": "after section 1"
    }
  ]
}`;

export const QUESTIONS_GENERATION_PROMPT = `You are an expert assessment designer. Generate assessment questions for the following lesson.

Module: {{moduleTitle}}
Lesson: {{lessonTitle}}
Content Summary: {{contentSummary}}
Learning Objectives: {{learningObjectives}}

Generate a mix of:
1. Multiple choice questions (3-5 questions)
2. True/False questions (2-3 questions)
3. Short answer questions (2-3 questions)

Each question should:
- Test understanding of key concepts
- Be clear and unambiguous
- Have difficulty levels (easy, medium, hard)
- Include correct answers and explanations

Format the response as a JSON object with this structure:
{
  "questions": [
    {
      "type": "multiple_choice",
      "difficulty": "medium",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Explanation of why this is correct..."
    }
  ]
}`;

export const SME_QUESTIONS_PROMPT = `You are an expert instructional designer working with subject matter experts (SMEs). Based on the course outline and available resources, identify areas where additional expert input is needed.

Course Title: {{courseTitle}}
Course Outline: {{courseOutline}}
Available Resources: {{resourcesSummary}}

Generate specific questions for SMEs that will help:
1. Fill knowledge gaps
2. Verify technical accuracy
3. Add real-world examples
4. Ensure industry best practices
5. Validate learning objectives

Format the response as a JSON object with this structure:
{
  "questions": [
    {
      "category": "Technical Accuracy" | "Industry Examples" | "Best Practices" | "Learning Objectives",
      "question": "Question for the SME",
      "context": "Why this information is needed",
      "targetModule": "Module name (if specific)",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;

export const CONSOLIDATE_FEEDBACK_PROMPT = `You are an expert at synthesizing feedback from multiple reviewers. Analyze the feedback and create a prioritized list of changes.

Course Content: {{courseContent}}
Feedback from Reviewers:
{{allFeedback}}

Please:
1. Group similar feedback items
2. Identify conflicts or contradictions
3. Prioritize changes by impact and effort
4. Suggest specific edits

Format the response as a JSON object with this structure:
{
  "consolidatedFeedback": [
    {
      "category": "Content" | "Structure" | "Clarity" | "Technical" | "Design",
      "priority": "high" | "medium" | "low",
      "description": "Summary of the feedback",
      "affectedSections": ["module 1, lesson 2", "module 3, lesson 1"],
      "suggestedAction": "Specific action to take",
      "conflictingViews": false
    }
  ],
  "conflictResolutions": [
    {
      "issue": "Description of the conflict",
      "options": ["Option 1", "Option 2"],
      "recommendation": "Recommended approach with reasoning"
    }
  ]
}`;

export const APPLY_UPDATES_PROMPT = `You are an expert editor applying approved changes to course content. Update the content based on the consolidated feedback.

Original Content: {{originalContent}}
Approved Changes:
{{approvedChanges}}

Please:
1. Apply all approved changes carefully
2. Maintain the original structure unless changes require restructuring
3. Ensure consistency in tone and style
4. Preserve any existing examples that weren't marked for change

Return the complete updated content in the same format as the original.`;

export function fillPromptTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(value));
  }
  return result;
}
