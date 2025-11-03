'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface Phase1Data {
  title: string;
  description: string;
  targetAudience: string;
  learningObjectives: string[];
  estimatedDuration: number;
  deliveryFormat: string;
  priority: string;
}

interface Phase1IdeaCaptureProps {
  onSubmit: (data: Phase1Data) => Promise<void>;
  initialData?: Partial<Phase1Data>;
}

export function Phase1IdeaCapture({ onSubmit, initialData }: Phase1IdeaCaptureProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Phase1Data>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    targetAudience: initialData?.targetAudience || '',
    learningObjectives: initialData?.learningObjectives || [''],
    estimatedDuration: initialData?.estimatedDuration || 60,
    deliveryFormat: initialData?.deliveryFormat || 'self-paced',
    priority: initialData?.priority || 'normal',
  });

  const [currentObjective, setCurrentObjective] = useState('');

  const addLearningObjective = () => {
    if (currentObjective.trim()) {
      setFormData({
        ...formData,
        learningObjectives: [...formData.learningObjectives, currentObjective.trim()],
      });
      setCurrentObjective('');
    }
  };

  const removeLearningObjective = (index: number) => {
    setFormData({
      ...formData,
      learningObjectives: formData.learningObjectives.filter((_, i) => i !== index),
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required';
    }

    if (formData.learningObjectives.filter(obj => obj.trim()).length === 0) {
      newErrors.learningObjectives = 'At least one learning objective is required';
    }

    if (formData.estimatedDuration < 1) {
      newErrors.estimatedDuration = 'Duration must be at least 1 minute';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Filter out empty objectives
      const cleanedData = {
        ...formData,
        learningObjectives: formData.learningObjectives.filter(obj => obj.trim()),
      };

      await onSubmit(cleanedData);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to save course data' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>
            Define the basic information about your course
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Course Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Course Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Introduction to Web Development"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isLoading}
              required
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Course Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Course Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description of what this course will cover..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={4}
              required
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              placeholder="e.g., Beginners with no programming experience"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Who is this course designed for?
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learning Objectives</CardTitle>
          <CardDescription>
            What will students be able to do after completing this course?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Learning Objective */}
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Build a simple website using HTML and CSS"
              value={currentObjective}
              onChange={(e) => setCurrentObjective(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLearningObjective();
                }
              }}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addLearningObjective}
              disabled={isLoading || !currentObjective.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* List of Learning Objectives */}
          {formData.learningObjectives.length > 0 && (
            <div className="space-y-2">
              {formData.learningObjectives.map((objective, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-md border p-3"
                >
                  <span className="flex-1 text-sm">{objective}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLearningObjective(index)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {errors.learningObjectives && (
            <p className="text-sm text-destructive">{errors.learningObjectives}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Settings</CardTitle>
          <CardDescription>
            Configure delivery format and scheduling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="estimatedDuration">
              Estimated Duration (minutes)
            </Label>
            <Input
              id="estimatedDuration"
              type="number"
              min="1"
              value={formData.estimatedDuration}
              onChange={(e) =>
                setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 0 })
              }
              disabled={isLoading}
            />
            {errors.estimatedDuration && (
              <p className="text-sm text-destructive">{errors.estimatedDuration}</p>
            )}
          </div>

          {/* Delivery Format */}
          <div className="space-y-2">
            <Label htmlFor="deliveryFormat">Delivery Format</Label>
            <Select
              value={formData.deliveryFormat}
              onValueChange={(value) =>
                setFormData({ ...formData, deliveryFormat: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="deliveryFormat">
                <SelectValue placeholder="Select delivery format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self-paced">Self-Paced</SelectItem>
                <SelectItem value="instructor-led">Instructor-Led</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
              disabled={isLoading}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {errors.submit}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save and Continue to Phase 2'}
        </Button>
      </div>
    </form>
  );
}
