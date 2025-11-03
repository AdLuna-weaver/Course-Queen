'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  BookOpen,
  FileText,
  Palette,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getCourse, getWizardPhase, updateWizardPhase } from '@/app/(dashboard)/courses/actions';
import { getResources } from '@/app/(dashboard)/courses/resource-actions';

interface Lesson {
  title: string;
  description: string;
  order: number;
  estimatedDuration: number;
  keyTopics: string[];
}

interface Module {
  title: string;
  description: string;
  order: number;
  estimatedDuration: number;
  learningObjectives: string[];
  lessons: Lesson[];
}

interface Outline {
  modules: Module[];
}

interface Phase4OutlineProps {
  courseId: string;
}

export function Phase4Outline({ courseId }: Phase4OutlineProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Context summary state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [hasWritingStyle, setHasWritingStyle] = useState(false);

  // Outline state
  const [outline, setOutline] = useState<Outline | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  // Generation metadata
  const [tokensUsed, setTokensUsed] = useState<any>(null);
  const [cost, setCost] = useState<number>(0);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  async function loadCourseData() {
    setLoading(true);
    try {
      const [course, phase1Data, phase3Data, resources] = await Promise.all([
        getCourse(courseId),
        getWizardPhase(courseId, 1),
        getWizardPhase(courseId, 3),
        getResources(courseId),
      ]);

      if (course) {
        setCourseTitle(course.title || '');
        setCourseDescription(course.description || '');
        setLearningObjectives(course.outline?.learningObjectives || []);

        // Load existing outline if available
        if (course.outline?.modules) {
          setOutline({ modules: course.outline.modules });
        }
      }

      setResourcesCount(resources.length);
      setHasWritingStyle(!!phase3Data?.data);
    } catch (err) {
      console.error('Error loading course data:', err);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateOutline() {
    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate outline');
      }

      setOutline(data.outline);
      setTokensUsed(data.tokensUsed);
      setCost(data.cost);

      // Expand all modules by default
      if (data.outline.modules) {
        setExpandedModules(new Set(data.outline.modules.map((_: any, i: number) => i)));
      }
    } catch (err: any) {
      console.error('Error generating outline:', err);
      setError(err.message || 'Failed to generate outline');
    } finally {
      setGenerating(false);
    }
  }

  function toggleModule(index: number) {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  }

  function updateModuleField(moduleIndex: number, field: string, value: any) {
    if (!outline) return;
    const newModules = [...outline.modules];
    newModules[moduleIndex] = { ...newModules[moduleIndex], [field]: value };
    setOutline({ modules: newModules });
  }

  function updateLessonField(moduleIndex: number, lessonIndex: number, field: string, value: any) {
    if (!outline) return;
    const newModules = [...outline.modules];
    const newLessons = [...newModules[moduleIndex].lessons];
    newLessons[lessonIndex] = { ...newLessons[lessonIndex], [field]: value };
    newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: newLessons };
    setOutline({ modules: newModules });
  }

  function addModule() {
    if (!outline) return;
    const newModule: Module = {
      title: 'New Module',
      description: '',
      order: outline.modules.length + 1,
      estimatedDuration: 60,
      learningObjectives: [],
      lessons: [],
    };
    setOutline({ modules: [...outline.modules, newModule] });
    setExpandedModules(new Set([...expandedModules, outline.modules.length]));
  }

  function removeModule(index: number) {
    if (!outline) return;
    const newModules = outline.modules.filter((_, i) => i !== index);
    // Update order
    newModules.forEach((mod, i) => {
      mod.order = i + 1;
    });
    setOutline({ modules: newModules });
  }

  function addLesson(moduleIndex: number) {
    if (!outline) return;
    const newModules = [...outline.modules];
    const newLesson: Lesson = {
      title: 'New Lesson',
      description: '',
      order: newModules[moduleIndex].lessons.length + 1,
      estimatedDuration: 15,
      keyTopics: [],
    };
    newModules[moduleIndex].lessons.push(newLesson);
    setOutline({ modules: newModules });
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    if (!outline) return;
    const newModules = [...outline.modules];
    newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter(
      (_, i) => i !== lessonIndex
    );
    // Update order
    newModules[moduleIndex].lessons.forEach((lesson, i) => {
      lesson.order = i + 1;
    });
    setOutline({ modules: newModules });
  }

  function calculateTotalDuration(): number {
    if (!outline) return 0;
    return outline.modules.reduce((total, module) => total + module.estimatedDuration, 0);
  }

  async function handleSave() {
    if (!outline) return;

    setSaving(true);
    setError('');

    try {
      // Save outline to courses.outline and mark phase 4 complete
      const result = await updateWizardPhase(courseId, 4, { outline: outline.modules }, true);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save outline');
      }

      // Also update the course outline field
      const response = await fetch(`/api/courses/${courseId}/outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outline: { modules: outline.modules, learningObjectives } }),
      });

      if (!response.ok) {
        throw new Error('Failed to update course outline');
      }

      // Navigate to Phase 5
      router.push(`/courses/${courseId}/wizard?phase=5`);
    } catch (err: any) {
      console.error('Error saving outline:', err);
      setError(err.message || 'Failed to save outline');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    router.push(`/courses/${courseId}/wizard?phase=3`);
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
                onClick={handleGenerateOutline}
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Context Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Context Ready
          </CardTitle>
          <CardDescription>
            The AI will use the following information to generate your course outline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Course Title</p>
                <p className="text-sm text-muted-foreground truncate">{courseTitle}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Learning Objectives</p>
                <p className="text-sm text-muted-foreground">
                  {learningObjectives.length} objective{learningObjectives.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Uploaded Resources</p>
                <p className="text-sm text-muted-foreground">
                  {resourcesCount} resource{resourcesCount !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <Palette className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Writing Style</p>
                <p className="text-sm text-muted-foreground">
                  {hasWritingStyle ? 'Preferences defined' : 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              {courseDescription}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Generation Section */}
      {!outline && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Course Outline Generation
            </CardTitle>
            <CardDescription>
              Let AI create a comprehensive course structure based on your inputs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <Button
                size="lg"
                onClick={handleGenerateOutline}
                disabled={generating}
                className="gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    AI is analyzing your course requirements...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Course Outline
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                This will use Claude Sonnet 4.5 to generate a structured course outline
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outline Display and Editing */}
      {outline && (
        <>
          {/* Generation Metadata */}
          {tokensUsed && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Tokens: {tokensUsed.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cost: ${cost.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Total Duration: {calculateTotalDuration()} minutes
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleGenerateOutline} disabled={generating}>
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      'Regenerate'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Outline Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Outline</CardTitle>
                  <CardDescription>Edit and refine your course structure</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addModule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {outline.modules.map((module, moduleIndex) => (
                <div
                  key={moduleIndex}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Module Header */}
                  <div className="bg-muted/50 p-4">
                    <div className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={() => toggleModule(moduleIndex)}
                      >
                        {expandedModules.has(moduleIndex) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-semibold text-muted-foreground mt-2">
                            Module {module.order}
                          </span>
                          <Input
                            value={module.title}
                            onChange={(e) =>
                              updateModuleField(moduleIndex, 'title', e.target.value)
                            }
                            className="font-semibold"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeModule(moduleIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Textarea
                          value={module.description}
                          onChange={(e) =>
                            updateModuleField(moduleIndex, 'description', e.target.value)
                          }
                          placeholder="Module description"
                          rows={2}
                        />
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Duration (min):</Label>
                            <Input
                              type="number"
                              value={module.estimatedDuration}
                              onChange={(e) =>
                                updateModuleField(
                                  moduleIndex,
                                  'estimatedDuration',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Module Content (Lessons) */}
                  {expandedModules.has(moduleIndex) && (
                    <div className="p-4 space-y-3">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lessonIndex}
                          className="border rounded-md p-3 space-y-2"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-muted-foreground mt-2">
                              {module.order}.{lesson.order}
                            </span>
                            <Input
                              value={lesson.title}
                              onChange={(e) =>
                                updateLessonField(
                                  moduleIndex,
                                  lessonIndex,
                                  'title',
                                  e.target.value
                                )
                              }
                              className="text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeLesson(moduleIndex, lessonIndex)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          <Textarea
                            value={lesson.description}
                            onChange={(e) =>
                              updateLessonField(
                                moduleIndex,
                                lessonIndex,
                                'description',
                                e.target.value
                              )
                            }
                            placeholder="Lesson description"
                            rows={2}
                            className="text-sm"
                          />
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Duration (min):</Label>
                            <Input
                              type="number"
                              value={lesson.estimatedDuration}
                              onChange={(e) =>
                                updateLessonField(
                                  moduleIndex,
                                  lessonIndex,
                                  'estimatedDuration',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addLesson(moduleIndex)}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Lesson
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handleBack} disabled={saving || generating}>
          Back
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || generating || !outline}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save & Continue to SME Questions'
          )}
        </Button>
      </div>
    </div>
  );
}
