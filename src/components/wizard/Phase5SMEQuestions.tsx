'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  Users,
  BookOpen,
  DollarSign,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getCourse, updateWizardPhase } from '@/app/(dashboard)/courses/actions';
import { getTeamMembers } from '@/app/(dashboard)/courses/resource-actions';
import { createClient } from '@/lib/supabase/client';

interface SMEQuestion {
  id?: string;
  question: string;
  context: string;
  category: string;
  priority: string;
  targetModule?: string;
  smeId: string;
  smeEmail?: string;
  status?: string;
}

interface SME {
  id: string;
  user_id: string | null;
  invited_email: string | null;
  role: string;
  invitation_status: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  profiles?: {
    id: string;
    email: string;
  }[] | {
    id: string;
    email: string;
  };
  email: string;
  status: string;
}

interface Phase5SMEQuestionsProps {
  courseId: string;
}

export function Phase5SMEQuestions({ courseId }: Phase5SMEQuestionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Course data
  const [courseTitle, setCourseTitle] = useState('');
  const [modulesCount, setModulesCount] = useState(0);
  const [smeList, setSmeList] = useState<SME[]>([]);

  // Questions state
  const [questions, setQuestions] = useState<SMEQuestion[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Generation metadata
  const [tokensUsed, setTokensUsed] = useState<any>(null);
  const [cost, setCost] = useState<number>(0);
  const [questionsSent, setQuestionsSent] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  async function loadCourseData() {
    setLoading(true);
    try {
      const [course, teamMembers] = await Promise.all([
        getCourse(courseId),
        getTeamMembers(courseId),
      ]);

      if (course) {
        setCourseTitle(course.title || '');
        setModulesCount(course.outline?.modules?.length || 0);
      }

      // Filter only SME role members
      const smes = teamMembers.filter((member: any) => member.role === 'SME');
      setSmeList(smes);

      // Load existing questions if any
      const supabase = createClient();
      const { data: existingQuestions } = await supabase
        .from('sme_questions')
        .select('*, profiles!sme_questions_sme_id_fkey(email)')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (existingQuestions && existingQuestions.length > 0) {
        const formattedQuestions = existingQuestions.map((q: any) => ({
          id: q.id,
          question: q.question,
          context: q.context,
          category: q.category,
          priority: q.priority,
          targetModule: q.target_module,
          smeId: q.sme_id,
          smeEmail: q.profiles?.email,
          status: q.status,
        }));
        setQuestions(formattedQuestions);
      }
    } catch (err) {
      console.error('Error loading course data:', err);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateQuestions() {
    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-sme-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      // Format questions with SME info
      const formattedQuestions = data.questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        context: q.context,
        category: q.category,
        priority: q.priority,
        targetModule: q.target_module,
        smeId: q.sme_id,
        smeEmail: q.profiles?.email,
        status: q.status,
      }));

      setQuestions(formattedQuestions);
      setTokensUsed(data.tokensUsed);
      setCost(data.cost);
    } catch (err: any) {
      console.error('Error generating questions:', err);
      setError(err.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  }

  function addCustomQuestion(smeId: string) {
    const newQuestion: SMEQuestion = {
      question: '',
      context: '',
      category: 'Technical',
      priority: 'Medium',
      smeId,
      smeEmail: smeList.find((s) => s.id === smeId)?.email,
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestionId('new-' + Date.now());
  }

  async function saveQuestion(question: SMEQuestion, index: number) {
    if (!question.question.trim()) {
      setError('Question text is required');
      return;
    }

    const supabase = createClient();

    try {
      if (question.id) {
        // Update existing question
        const { error } = await supabase
          .from('sme_questions')
          .update({
            question: question.question,
            context: question.context,
            category: question.category,
            priority: question.priority,
            target_module: question.targetModule,
          })
          .eq('id', question.id);

        if (error) throw error;
      } else {
        // Insert new question
        const { data, error } = await supabase
          .from('sme_questions')
          .insert({
            course_id: courseId,
            sme_id: question.smeId,
            question: question.question,
            context: question.context,
            category: question.category,
            priority: question.priority,
            target_module: question.targetModule,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        // Update with ID
        const newQuestions = [...questions];
        newQuestions[index] = { ...question, id: data.id };
        setQuestions(newQuestions);
      }

      setEditingQuestionId(null);
      setError('');
    } catch (err) {
      console.error('Error saving question:', err);
      setError('Failed to save question');
    }
  }

  async function deleteQuestion(questionId: string | undefined, index: number) {
    if (!questionId) {
      // Just remove from UI if not saved yet
      setQuestions(questions.filter((_, i) => i !== index));
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('sme_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(questions.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Failed to delete question');
    }
  }

  function updateQuestion(index: number, field: string, value: any) {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  }

  async function handleSendQuestions() {
    setSending(true);
    setError('');

    try {
      const supabase = createClient();

      // Mark all questions as sent
      const questionIds = questions.filter((q) => q.id).map((q) => q.id);

      if (questionIds.length > 0) {
        const { error } = await supabase
          .from('sme_questions')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .in('id', questionIds);

        if (error) throw error;
      }

      setQuestionsSent(true);

      // Update local state
      setQuestions(questions.map(q => ({ ...q, status: 'sent' })));
    } catch (err) {
      console.error('Error sending questions:', err);
      setError('Failed to send questions');
    } finally {
      setSending(false);
    }
  }

  async function handleContinue() {
    setSaving(true);
    setError('');

    try {
      // Mark phase 5 as complete
      const result = await updateWizardPhase(
        courseId,
        5,
        {
          questionsGenerated: questions.length,
          questionsSent,
        },
        true
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save progress');
      }

      // Navigate to Phase 6
      router.push(`/courses/${courseId}/wizard?phase=6`);
    } catch (err: any) {
      console.error('Error saving progress:', err);
      setError(err.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    router.push(`/courses/${courseId}/wizard?phase=4`);
  }

  function getQuestionsBySmE(smeId: string) {
    return questions.filter((q) => q.smeId === smeId);
  }

  function getPriorityVariant(priority: string) {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {error}
            {error.includes('Failed to generate') && (
              <Button
                variant="link"
                className="h-auto p-0 text-destructive underline ml-2"
                onClick={handleGenerateQuestions}
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content Gap Analysis Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Content Gap Analysis Ready
          </CardTitle>
          <CardDescription>
            AI will analyze your course outline to identify areas needing SME input
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Course Outline</p>
                <p className="text-sm text-muted-foreground">
                  {modulesCount} module{modulesCount !== 1 ? 's' : ''} defined
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium">SME Team Members</p>
                <p className="text-sm text-muted-foreground">
                  {smeList.length} SME{smeList.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </div>

          {smeList.length > 0 && (
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground mb-2">SMEs:</Label>
              <div className="flex flex-wrap gap-2">
                {smeList.map((sme) => (
                  <Badge key={sme.id} variant="secondary">
                    {sme.email}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Section */}
      {questions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI SME Question Generation
            </CardTitle>
            <CardDescription>
              Generate targeted questions for your SMEs based on course outline analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {smeList.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No SME team members found. Please add SMEs in Phase 2 before generating questions.
                </p>
                <Button variant="outline" onClick={() => router.push(`/courses/${courseId}/wizard?phase=2`)}>
                  Go to Phase 2
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Button
                  size="lg"
                  onClick={handleGenerateQuestions}
                  disabled={generating}
                  className="gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      AI is analyzing course outline for knowledge gaps...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5" />
                      Generate SME Questions
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  This will generate 3-5 targeted questions for each SME
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generation Metadata */}
      {questions.length > 0 && tokensUsed && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Questions: {questions.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Cost: ${cost.toFixed(4)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateQuestions}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    'Regenerate Questions'
                  )}
                </Button>
                {!questionsSent && questions.some(q => q.id) && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSendQuestions}
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Questions to SMEs
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success message after sending */}
      {questionsSent && (
        <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Questions sent! SMEs will be notified.
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                SMEs can now review and respond to their assigned questions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Questions Display - Grouped by SME */}
      {questions.length > 0 && (
        <div className="space-y-6">
          {smeList.map((sme) => {
            const smeQuestions = getQuestionsBySmE(sme.id);
            if (smeQuestions.length === 0) return null;

            return (
              <Card key={sme.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {sme.email}
                      </CardTitle>
                      <CardDescription>
                        {smeQuestions.length} question{smeQuestions.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCustomQuestion(sme.id)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {smeQuestions.map((question, globalIndex) => {
                    const index = questions.indexOf(question);
                    const isEditing = editingQuestionId === question.id || editingQuestionId === `new-${index}`;

                    return (
                      <div
                        key={question.id || `new-${index}`}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getPriorityVariant(question.priority)}>
                              {question.priority}
                            </Badge>
                            <Badge variant="outline">{question.category}</Badge>
                            {question.status === 'sent' && (
                              <Badge variant="success">Sent</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!isEditing && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingQuestionId(question.id || `new-${index}`)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => deleteQuestion(question.id, index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Question</Label>
                              <Textarea
                                value={question.question}
                                onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                placeholder="Enter your question for the SME"
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Context / Why this question is needed</Label>
                              <Textarea
                                value={question.context}
                                onChange={(e) => updateQuestion(index, 'context', e.target.value)}
                                placeholder="Explain why this information is important"
                                rows={2}
                              />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                  value={question.category}
                                  onValueChange={(value) => updateQuestion(index, 'category', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Technical">Technical</SelectItem>
                                    <SelectItem value="Process">Process</SelectItem>
                                    <SelectItem value="Examples">Examples</SelectItem>
                                    <SelectItem value="Best Practices">Best Practices</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                  value={question.priority}
                                  onValueChange={(value) => updateQuestion(index, 'priority', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingQuestionId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => saveQuestion(question, index)}
                              >
                                Save Question
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{question.question}</p>
                            {question.context && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Context:</span> {question.context}
                              </p>
                            )}
                            {question.targetModule && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Module:</span> {question.targetModule}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handleBack} disabled={saving || generating}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={saving || generating || questions.length === 0}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save & Continue to Final Review'
          )}
        </Button>
      </div>
    </div>
  );
}
