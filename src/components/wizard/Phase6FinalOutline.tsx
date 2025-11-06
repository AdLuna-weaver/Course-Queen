'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  FileCheck,
  ListTodo,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { getCourse, updateWizardPhase } from '@/app/(dashboard)/courses/actions';
import { getTeamMembers } from '@/app/(dashboard)/courses/resource-actions';
import { createClient } from '@/lib/supabase/client';

interface Module {
  title: string;
  description: string;
  order: number;
  estimatedDuration: number;
  learningObjectives: string[];
  lessons: any[];
}

interface Task {
  id?: string;
  title: string;
  description: string;
  module_reference: string;
  assigned_to?: string;
  assignedToEmail?: string;
  due_date?: Date;
  priority: string;
  status: string;
}

interface TeamMember {
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

interface Phase6FinalOutlineProps {
  courseId: string;
}

export function Phase6FinalOutline({ courseId }: Phase6FinalOutlineProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [error, setError] = useState('');

  // Outline state
  const [modules, setModules] = useState<Module[]>([]);
  const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null);

  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Final approval state
  const [outlineLocked, setOutlineLocked] = useState(false);
  const [checklistItems, setChecklistItems] = useState({
    outlineComplete: false,
    modulesHaveDescriptions: false,
    tasksAssigned: false,
    readyForGeneration: false,
  });

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  useEffect(() => {
    // Auto-update checklist
    updateChecklist();
  }, [modules, tasks]);

  async function loadCourseData() {
    setLoading(true);
    try {
      const [course, members] = await Promise.all([
        getCourse(courseId),
        getTeamMembers(courseId),
      ]);

      if (course && course.outline?.modules) {
        setModules(course.outline.modules);
      }

      setTeamMembers(members);

      // Load existing tasks
      const supabase = createClient();
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('*, profiles!tasks_assigned_to_fkey(email)')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (existingTasks && existingTasks.length > 0) {
        const formattedTasks = existingTasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          module_reference: t.module_reference,
          assigned_to: t.assigned_to,
          assignedToEmail: t.profiles?.email,
          due_date: t.due_date ? new Date(t.due_date) : undefined,
          priority: t.priority,
          status: t.status,
        }));
        setTasks(formattedTasks);
      }
    } catch (err) {
      console.error('Error loading course data:', err);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }

  function updateChecklist() {
    setChecklistItems({
      outlineComplete: modules.length > 0,
      modulesHaveDescriptions: modules.every((m) => m.description && m.description.trim()),
      tasksAssigned: tasks.length > 0 && tasks.every((t) => t.assigned_to),
      readyForGeneration: modules.length > 0 && tasks.length > 0,
    });
  }

  function moveModule(index: number, direction: 'up' | 'down') {
    const newModules = [...modules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newModules.length) return;

    // Swap
    [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]];

    // Update order
    newModules.forEach((m, i) => {
      m.order = i + 1;
    });

    setModules(newModules);
  }

  function updateModule(index: number, field: string, value: any) {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setModules(newModules);
  }

  function addModule() {
    const newModule: Module = {
      title: 'New Module',
      description: '',
      order: modules.length + 1,
      estimatedDuration: 60,
      learningObjectives: [],
      lessons: [],
    };
    setModules([...modules, newModule]);
    setEditingModuleIndex(modules.length);
  }

  function removeModule(index: number) {
    const newModules = modules.filter((_, i) => i !== index);
    newModules.forEach((m, i) => {
      m.order = i + 1;
    });
    setModules(newModules);
  }

  async function generateTasks() {
    setGeneratingTasks(true);
    setError('');

    try {
      const generatedTasks: Task[] = [];

      // Generate tasks for each module
      modules.forEach((module) => {
        // Find appropriate team members
        const creator = teamMembers.find((m) => m.role === 'Creator');
        const sme = teamMembers.find((m) => m.role === 'SME');
        const reviewer = teamMembers.find((m) => m.role === 'Reviewer');

        // Task 1: Write content
        generatedTasks.push({
          title: `Write ${module.title} content`,
          description: `Create comprehensive content for ${module.title} module including all lessons and examples.`,
          module_reference: module.title,
          assigned_to: creator?.id,
          assignedToEmail: creator?.email,
          priority: 'High',
          status: 'Todo',
        });

        // Task 2: SME review (if SME exists)
        if (sme) {
          generatedTasks.push({
            title: `Review ${module.title} technical accuracy`,
            description: `Review the content for ${module.title} to ensure technical accuracy and industry best practices.`,
            module_reference: module.title,
            assigned_to: sme.id,
            assignedToEmail: sme.email,
            priority: 'High',
            status: 'Todo',
          });
        }

        // Task 3: Create assessments
        generatedTasks.push({
          title: `Create assessment questions for ${module.title}`,
          description: `Develop quiz questions and practical exercises for ${module.title}.`,
          module_reference: module.title,
          assigned_to: creator?.id,
          assignedToEmail: creator?.email,
          priority: 'Medium',
          status: 'Todo',
        });
      });

      // Task: Final course review
      const reviewer = teamMembers.find((m) => m.role === 'Reviewer');
      if (reviewer) {
        generatedTasks.push({
          title: 'Review final course',
          description: 'Complete final review of entire course content, structure, and assessments.',
          module_reference: 'All modules',
          assigned_to: reviewer.id,
          assignedToEmail: reviewer.email,
          priority: 'High',
          status: 'Todo',
        });
      }

      setTasks(generatedTasks);
    } catch (err) {
      console.error('Error generating tasks:', err);
      setError('Failed to generate tasks');
    } finally {
      setGeneratingTasks(false);
    }
  }

  function addCustomTask() {
    const newTask: Task = {
      title: '',
      description: '',
      module_reference: '',
      priority: 'Medium',
      status: 'Todo',
    };
    setTasks([...tasks, newTask]);
    setEditingTaskId('new-' + Date.now());
  }

  function updateTask(index: number, field: string, value: any) {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  }

  async function saveTask(task: Task, index: number) {
    if (!task.title.trim()) {
      setError('Task title is required');
      return;
    }

    const supabase = createClient();

    try {
      if (task.id) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update({
            title: task.title,
            description: task.description,
            module_reference: task.module_reference,
            assigned_to: task.assigned_to,
            due_date: task.due_date?.toISOString(),
            priority: task.priority,
            status: task.status,
          })
          .eq('id', task.id);

        if (error) throw error;
      } else {
        // Insert new task
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            course_id: courseId,
            title: task.title,
            description: task.description,
            module_reference: task.module_reference,
            assigned_to: task.assigned_to,
            due_date: task.due_date?.toISOString(),
            priority: task.priority,
            status: task.status,
          })
          .select()
          .single();

        if (error) throw error;

        // Update with ID
        const newTasks = [...tasks];
        newTasks[index] = { ...task, id: data.id };
        setTasks(newTasks);
      }

      setEditingTaskId(null);
      setError('');
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Failed to save task');
    }
  }

  async function deleteTask(taskId: string | undefined, index: number) {
    if (!taskId) {
      setTasks(tasks.filter((_, i) => i !== index));
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  }

  function calculateTotalDuration(): number {
    return modules.reduce((total, module) => total + module.estimatedDuration, 0);
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

  async function handleFinalize() {
    if (!outlineLocked) {
      setError('Please check the "Lock Outline" box to finalize');
      return;
    }

    if (!checklistItems.outlineComplete || !checklistItems.tasksAssigned) {
      setError('Please complete all checklist items before finalizing');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const supabase = createClient();

      // Save final outline to courses
      const { error: outlineError } = await supabase
        .from('courses')
        .update({
          outline: { modules, learningObjectives: [] },
          outline_approved_at: new Date().toISOString(),
        })
        .eq('id', courseId);

      if (outlineError) throw outlineError;

      // Save all tasks that don't have IDs yet
      const unsavedTasks = tasks.filter((t) => !t.id);
      if (unsavedTasks.length > 0) {
        const tasksToInsert = unsavedTasks.map((t) => ({
          course_id: courseId,
          title: t.title,
          description: t.description,
          module_reference: t.module_reference,
          assigned_to: t.assigned_to,
          due_date: t.due_date?.toISOString(),
          priority: t.priority,
          status: t.status,
        }));

        const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);

        if (tasksError) throw tasksError;
      }

      // Mark phase 6 as complete
      const result = await updateWizardPhase(
        courseId,
        6,
        {
          outlineApproved: true,
          tasksGenerated: tasks.length,
          totalDuration: calculateTotalDuration(),
        },
        true
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save progress');
      }

      // Navigate to Phase 7
      router.push(`/courses/${courseId}/wizard?phase=7`);
    } catch (err: any) {
      console.error('Error finalizing:', err);
      setError(err.message || 'Failed to finalize outline');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    router.push(`/courses/${courseId}/wizard?phase=5`);
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
          {error}
        </div>
      )}

      {/* SECTION A: Outline Review */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Outline Review
              </CardTitle>
              <CardDescription>
                Review and finalize your course structure
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addModule}>
                <Plus className="mr-2 h-4 w-4" />
                Add Module
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Incorporate SME Answers
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No modules found. Please complete Phase 4 first.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/courses/${courseId}/wizard?phase=4`)}
              >
                Go to Phase 4
              </Button>
            </div>
          ) : (
            modules.map((module, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveModule(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveModule(index, 'down')}
                        disabled={index === modules.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                          Module {module.order}
                        </span>
                        {editingModuleIndex === index ? (
                          <Input
                            value={module.title}
                            onChange={(e) => updateModule(index, 'title', e.target.value)}
                            className="font-semibold"
                          />
                        ) : (
                          <h3 className="font-semibold">{module.title}</h3>
                        )}
                      </div>
                      {editingModuleIndex === index ? (
                        <Textarea
                          value={module.description}
                          onChange={(e) => updateModule(index, 'description', e.target.value)}
                          placeholder="Module description"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {editingModuleIndex === index ? (
                            <Input
                              type="number"
                              value={module.estimatedDuration}
                              onChange={(e) =>
                                updateModule(index, 'estimatedDuration', parseInt(e.target.value) || 0)
                              }
                              className="w-20"
                            />
                          ) : (
                            <span className="text-sm">{module.estimatedDuration} min</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingModuleIndex === index ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingModuleIndex(null)}
                      >
                        Done
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingModuleIndex(index)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => removeModule(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          {modules.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Total Course Duration</span>
                <span className="text-muted-foreground">
                  {calculateTotalDuration()} minutes ({Math.round(calculateTotalDuration() / 60)} hours)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION B: Task Generation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Task Breakdown
              </CardTitle>
              <CardDescription>
                Generate and manage project tasks for course development
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {tasks.length === 0 ? (
                <Button
                  onClick={generateTasks}
                  disabled={generatingTasks || modules.length === 0}
                >
                  {generatingTasks ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating project tasks...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Task Breakdown
                    </>
                  )}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={addCustomTask}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                No tasks generated yet. Click the button above to create tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Todo ({tasks.length})</h4>
              </div>
              {tasks.map((task, index) => {
                const isEditing = editingTaskId === task.id || editingTaskId === `new-${index}`;

                return (
                  <div
                    key={task.id || `new-${index}`}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Task Title</Label>
                          <Input
                            value={task.title}
                            onChange={(e) => updateTask(index, 'title', e.target.value)}
                            placeholder="Enter task title"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={task.description}
                            onChange={(e) => updateTask(index, 'description', e.target.value)}
                            placeholder="Task description"
                            rows={2}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Module/Section</Label>
                            <Input
                              value={task.module_reference}
                              onChange={(e) => updateTask(index, 'module_reference', e.target.value)}
                              placeholder="Module name"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Assigned To</Label>
                            <Select
                              value={task.assigned_to || ''}
                              onValueChange={(value) => {
                                const member = teamMembers.find((m) => m.id === value);
                                updateTask(index, 'assigned_to', value);
                                updateTask(index, 'assignedToEmail', member?.email);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select team member" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.email} ({member.role})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                              value={task.priority}
                              onValueChange={(value) => updateTask(index, 'priority', value)}
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

                          <div className="space-y-2">
                            <Label>Due Date</Label>
                            <DatePicker
                              date={task.due_date}
                              onDateChange={(date) => updateTask(index, 'due_date', date)}
                              placeholder="Select date"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTaskId(null)}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => saveTask(task, index)}>
                            Save Task
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium">{task.title}</h4>
                              <Badge variant={getPriorityVariant(task.priority)}>
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingTaskId(task.id || `new-${index}`)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => deleteTask(task.id, index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {task.assignedToEmail && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {task.assignedToEmail}
                            </div>
                          )}
                          {task.module_reference && (
                            <div className="flex items-center gap-1">
                              <FileCheck className="h-3 w-3" />
                              {task.module_reference}
                            </div>
                          )}
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {task.due_date.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION C: Final Approval */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Final Approval
          </CardTitle>
          <CardDescription>Review checklist and lock outline to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="outline-complete"
                checked={checklistItems.outlineComplete}
                disabled
              />
              <label
                htmlFor="outline-complete"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Outline is complete ({modules.length} module{modules.length !== 1 ? 's' : ''})
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="modules-descriptions"
                checked={checklistItems.modulesHaveDescriptions}
                disabled
              />
              <label
                htmlFor="modules-descriptions"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                All modules have descriptions
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="tasks-assigned"
                checked={checklistItems.tasksAssigned}
                disabled
              />
              <label
                htmlFor="tasks-assigned"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Tasks are assigned ({tasks.filter((t) => t.assigned_to).length}/{tasks.length})
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ready-generation"
                checked={checklistItems.readyForGeneration}
                disabled
              />
              <label
                htmlFor="ready-generation"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ready for AI generation
              </label>
            </div>
          </div>

          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total Estimated Time</span>
              <span className="text-muted-foreground">
                {calculateTotalDuration()} minutes ({Math.round(calculateTotalDuration() / 60)} hours)
              </span>
            </div>

            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="lock-outline"
                checked={outlineLocked}
                onCheckedChange={(checked) => setOutlineLocked(checked as boolean)}
              />
              <label
                htmlFor="lock-outline"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                Lock outline and proceed to final generation
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handleBack} disabled={saving}>
          Back
        </Button>
        <Button
          onClick={handleFinalize}
          disabled={saving || !outlineLocked || !checklistItems.outlineComplete}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Finalize & Continue to Generation'
          )}
        </Button>
      </div>
    </div>
  );
}
