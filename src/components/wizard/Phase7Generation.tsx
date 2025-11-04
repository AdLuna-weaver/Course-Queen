'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  PlayCircle,
  Download,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
  Trophy,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { getCourse, updateWizardPhase } from '@/app/(dashboard)/courses/actions';
import { getResources } from '@/app/(dashboard)/courses/resource-actions';
import { createClient } from '@/lib/supabase/client';

interface Module {
  title: string;
  description: string;
  order: number;
  estimatedDuration: number;
  lessons: any[];
}

interface GeneratedContent {
  introduction: string;
  sections: Array<{
    heading: string;
    content: string;
    examples?: string[];
  }>;
  keyTakeaways: string[];
  suggestedMedia: Array<{
    type: string;
    description: string;
    placement: string;
  }>;
}

interface Phase7GenerationProps {
  courseId: string;
}

export function Phase7Generation({ courseId }: Phase7GenerationProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Course data
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [hasWritingStyle, setHasWritingStyle] = useState(false);
  const [hasSMEInput, setHasSMEInput] = useState(false);

  // Generation state
  const [generationMode, setGenerationMode] = useState<'all' | 'module'>('module');
  const [hasStarted, setHasStarted] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<Map<number, GeneratedContent>>(new Map());
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());

  // Statistics
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // UI state
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  useEffect(() => {
    if (completedModules.size === modules.length && modules.length > 0 && !allComplete) {
      setAllComplete(true);
      triggerCelebration();
    }
  }, [completedModules, modules.length]);

  async function loadCourseData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const [course, resources, phase3Data, smeQuestions] = await Promise.all([
        getCourse(courseId),
        getResources(courseId),
        supabase
          .from('wizard_phases')
          .select('data')
          .eq('course_id', courseId)
          .eq('phase', 3)
          .single()
          .then((r) => r.data),
        supabase
          .from('sme_questions')
          .select('id')
          .eq('course_id', courseId)
          .then((r) => r.data),
      ]);

      if (course) {
        setCourseTitle(course.title || '');
        setModules(course.outline?.modules || []);
      }

      setResourcesCount(resources.length);
      setHasWritingStyle(!!phase3Data);
      setHasSMEInput(!!(smeQuestions && smeQuestions.length > 0));

      // Check for existing generated content
      const { data: existingModules } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .eq('status', 'completed');

      if (existingModules && existingModules.length > 0) {
        const contentMap = new Map<number, GeneratedContent>();
        const completed = new Set<number>();

        existingModules.forEach((mod) => {
          const index = mod.order - 1;
          contentMap.set(index, mod.content);
          completed.add(index);
        });

        setGeneratedContent(contentMap);
        setCompletedModules(completed);
        setHasStarted(true);
      }
    } catch (err) {
      console.error('Error loading course data:', err);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }

  function calculateEstimatedCost(): number {
    // Rough estimate: ~1000 tokens per module (input) + ~3000 tokens output
    // Input: $0.003 per 1K, Output: $0.015 per 1K
    const avgInputTokens = 1000;
    const avgOutputTokens = 3000;
    const inputCost = (avgInputTokens / 1000) * 0.003;
    const outputCost = (avgOutputTokens / 1000) * 0.015;
    const costPerModule = inputCost + outputCost;
    return costPerModule * modules.length;
  }

  function calculateProgress(): number {
    if (modules.length === 0) return 0;
    return (completedModules.size / modules.length) * 100;
  }

  async function handleStartGeneration() {
    if (modules.length === 0) {
      setError('No modules to generate. Please complete Phase 4 first.');
      return;
    }

    setHasStarted(true);
    setStartTime(new Date());
    setError('');

    if (generationMode === 'all') {
      await generateAllModules();
    } else {
      // Start with first incomplete module
      const firstIncomplete = modules.findIndex((_, i) => !completedModules.has(i));
      setCurrentModuleIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
      if (firstIncomplete >= 0) {
        await generateModule(firstIncomplete);
      }
    }
  }

  async function generateAllModules() {
    for (let i = 0; i < modules.length; i++) {
      if (!completedModules.has(i)) {
        setCurrentModuleIndex(i);
        await generateModule(i);
      }
    }
  }

  async function generateModule(moduleIndex: number) {
    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          moduleIndex,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      // Update state
      const newContent = new Map(generatedContent);
      newContent.set(moduleIndex, data.content);
      setGeneratedContent(newContent);

      const newCompleted = new Set(completedModules);
      newCompleted.add(moduleIndex);
      setCompletedModules(newCompleted);

      // Update statistics
      setTotalCost((prev) => prev + data.cost);
      setTotalTokens((prev) => prev + data.tokensUsed.total);
      setTotalWords((prev) => prev + estimateWordCount(data.content));
    } catch (err: any) {
      console.error('Error generating module:', err);
      setError(err.message || 'Failed to generate module content');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerateModule(moduleIndex: number) {
    await generateModule(moduleIndex);
  }

  async function handleApproveAndContinue() {
    const nextIndex = modules.findIndex((_, i) => !completedModules.has(i));
    if (nextIndex >= 0) {
      setCurrentModuleIndex(nextIndex);
      await generateModule(nextIndex);
    }
  }

  function estimateWordCount(content: GeneratedContent): number {
    let text = content.introduction || '';
    content.sections?.forEach((s) => {
      text += ' ' + s.heading + ' ' + s.content;
    });
    return text.split(/\s+/).length;
  }

  function triggerCelebration() {
    // Confetti celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Fire multiple bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);
  }

  async function handleExportPreview() {
    let markdown = `# ${courseTitle}\n\n`;

    modules.forEach((module, index) => {
      const content = generatedContent.get(index);
      if (content) {
        markdown += `## Module ${index + 1}: ${module.title}\n\n`;
        markdown += `${content.introduction}\n\n`;

        content.sections?.forEach((section) => {
          markdown += `### ${section.heading}\n\n`;
          markdown += `${section.content}\n\n`;
        });

        if (content.keyTakeaways && content.keyTakeaways.length > 0) {
          markdown += `### Key Takeaways\n\n`;
          content.keyTakeaways.forEach((takeaway) => {
            markdown += `- ${takeaway}\n`;
          });
          markdown += '\n';
        }

        markdown += '---\n\n';
      }
    });

    // Create download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseTitle.replace(/\s+/g, '-')}-preview.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleCompleteCourse() {
    try {
      const supabase = createClient();

      // Update course status to draft
      await supabase
        .from('courses')
        .update({ status: 'draft', completed_at: new Date().toISOString() })
        .eq('id', courseId);

      // Mark phase 7 as complete
      await updateWizardPhase(
        courseId,
        7,
        {
          modulesGenerated: modules.length,
          totalCost,
          totalTokens,
          totalWords,
        },
        true
      );

      // Redirect to course view
      router.push(`/courses/${courseId}`);
    } catch (err) {
      console.error('Error completing course:', err);
      setError('Failed to complete course');
    }
  }

  function handleBack() {
    if (!hasStarted) {
      router.push(`/courses/${courseId}/wizard?phase=6`);
    }
  }

  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {generating && (
              <Button variant="outline" size="sm" onClick={() => handleRegenerateModule(currentModuleIndex)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Pre-Generation Summary */}
      {!hasStarted && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Ready for AI Generation
              </CardTitle>
              <CardDescription>
                All preparation complete. Review summary and start generating course content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{courseTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {modules.length} module{modules.length !== 1 ? 's' : ''} to generate
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                  <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Total Duration</p>
                    <p className="text-xs text-muted-foreground">
                      {modules.reduce((sum, m) => sum + m.estimatedDuration, 0)} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Resources Available</p>
                    <p className="text-xs text-muted-foreground">
                      {resourcesCount} resource{resourcesCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Configuration</p>
                    <div className="flex gap-2 mt-1">
                      {hasWritingStyle && <Badge variant="success">Writing Style</Badge>}
                      {hasSMEInput && <Badge variant="success">SME Input</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Estimated Cost</span>
                  </div>
                  <span className="text-lg font-semibold">${calculateEstimatedCost().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generation Options</CardTitle>
              <CardDescription>Choose how you want to generate content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={generationMode} onValueChange={(v) => setGenerationMode(v as 'all' | 'module')}>
                <div className="flex items-start space-x-3 space-y-0 p-4 border rounded-lg">
                  <RadioGroupItem value="module" id="module" />
                  <div className="flex-1">
                    <label
                      htmlFor="module"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Generate module by module (Recommended)
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Review and approve each module before continuing. More control, safer approach.
                    </p>
                  </div>
                  <Badge variant="success">Recommended</Badge>
                </div>

                <div className="flex items-start space-x-3 space-y-0 p-4 border rounded-lg">
                  <RadioGroupItem value="all" id="all" />
                  <div className="flex-1">
                    <label
                      htmlFor="all"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Generate all modules at once
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Faster but no preview until complete. Higher risk if issues occur.
                    </p>
                  </div>
                </div>
              </RadioGroup>

              <Button
                size="lg"
                onClick={handleStartGeneration}
                disabled={modules.length === 0}
                className="w-full"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Start Generation
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Progress Section */}
      {hasStarted && !allComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-pulse" />
              Generating Course Content
            </CardTitle>
            <CardDescription>
              {generating ? `Processing Module ${currentModuleIndex + 1} of ${modules.length}...` : 'Ready for next module'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(calculateProgress())}% complete</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {completedModules.size} of {modules.length} modules completed
              </p>
            </div>

            {generating && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Generating: {modules[currentModuleIndex]?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    AI is creating comprehensive content with examples and assessments...
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Cost So Far</p>
                  <p className="font-medium">${totalCost.toFixed(4)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Tokens Used</p>
                  <p className="font-medium">{totalTokens.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Words Generated</p>
                  <p className="font-medium">{totalWords.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {!generating && completedModules.has(currentModuleIndex) && generationMode === 'module' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Module {currentModuleIndex + 1} Generated</h4>
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Complete
                  </Badge>
                </div>

                {/* Preview */}
                <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/30">
                  {generatedContent.get(currentModuleIndex) && (
                    <div className="prose prose-sm max-w-none">
                      <h3>{modules[currentModuleIndex]?.title}</h3>
                      <p>{generatedContent.get(currentModuleIndex)!.introduction}</p>
                      {generatedContent.get(currentModuleIndex)!.sections?.slice(0, 2).map((section, i) => (
                        <div key={i}>
                          <h4>{section.heading}</h4>
                          <p>{section.content.substring(0, 200)}...</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleRegenerateModule(currentModuleIndex)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate This Module
                  </Button>
                  {currentModuleIndex < modules.length - 1 && (
                    <Button onClick={handleApproveAndContinue} className="flex-1">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve & Continue
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Final Review */}
      {allComplete && (
        <>
          <Card className="border-2 border-primary">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                Course Generation Complete! 🎉
              </CardTitle>
              <CardDescription>All modules have been successfully generated</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{completedModules.size}</p>
                  <p className="text-xs text-muted-foreground">Modules</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{totalWords.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Words</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">${totalCost.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {startTime ? formatDuration(Date.now() - startTime.getTime()) : '---'}
                  </p>
                  <p className="text-xs text-muted-foreground">Time Taken</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportPreview} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Export Preview
                </Button>
                <Button onClick={handleCompleteCourse} className="flex-1" size="lg">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Complete Course
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Full Course Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Course Preview</CardTitle>
              <CardDescription>Review all generated content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto border rounded-lg p-6 bg-muted/30">
                <h1 className="text-3xl font-bold mb-6">{courseTitle}</h1>
                {modules.map((module, index) => {
                  const content = generatedContent.get(index);
                  if (!content) return null;

                  return (
                    <div key={index} className="mb-8 pb-8 border-b last:border-b-0">
                      <h2 className="text-2xl font-semibold mb-4">
                        Module {index + 1}: {module.title}
                      </h2>
                      <div className="prose prose-sm max-w-none">
                        <p className="mb-4">{content.introduction}</p>
                        {content.sections?.map((section, i) => (
                          <div key={i} className="mb-4">
                            <h3 className="text-xl font-medium mb-2">{section.heading}</h3>
                            <p className="text-muted-foreground">{section.content.substring(0, 300)}...</p>
                          </div>
                        ))}
                        {content.keyTakeaways && content.keyTakeaways.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Key Takeaways:</h4>
                            <ul className="list-disc list-inside">
                              {content.keyTakeaways.map((takeaway, i) => (
                                <li key={i} className="text-sm text-muted-foreground">
                                  {takeaway}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handleBack} disabled={hasStarted || generating}>
          Back
        </Button>
        {allComplete && (
          <Button onClick={handleCompleteCourse} size="lg">
            <Trophy className="mr-2 h-5 w-5" />
            Complete Course
          </Button>
        )}
      </div>
    </div>
  );
}
