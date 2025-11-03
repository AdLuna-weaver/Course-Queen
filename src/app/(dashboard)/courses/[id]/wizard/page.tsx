'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { Phase1IdeaCapture } from '@/components/wizard/Phase1IdeaCapture';
import { Phase2ResourceTeam } from '@/components/wizard/Phase2ResourceTeam';
import { getCourse, getWizardPhase, updateWizardPhase } from '../../actions';

interface Course {
  id: string;
  title: string;
  description: string;
  target_audience: string;
  learning_objectives: string[];
  estimated_duration: number;
  delivery_format: string;
  priority: string;
}

interface WizardPhase {
  current_phase: number;
  completed_phases: number[];
  phase_1_data?: any;
  phase_2_data?: any;
}

export default function CourseWizardPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phaseParam = searchParams.get('phase');

  const [course, setCourse] = useState<Course | null>(null);
  const [wizardPhase, setWizardPhase] = useState<WizardPhase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Determine current phase from URL or wizard state
  const currentPhase = phaseParam ? parseInt(phaseParam) : wizardPhase?.current_phase || 1;

  useEffect(() => {
    loadCourseData();
  }, [params.id]);

  async function loadCourseData() {
    setLoading(true);
    setError('');

    try {
      const [courseData, wizardData] = await Promise.all([
        getCourse(params.id),
        getWizardPhase(params.id),
      ]);

      if (!courseData) {
        setError('Course not found');
        return;
      }

      setCourse(courseData);
      setWizardPhase(wizardData);
    } catch (err) {
      console.error('Error loading course:', err);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }

  async function handlePhase1Submit(data: any) {
    try {
      // Update Phase 1 wizard data
      const result = await updateWizardPhase(params.id, 1, data, true);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update course');
      }

      // Navigate to Phase 2
      router.push(`/courses/${params.id}/wizard?phase=2`);
      router.refresh();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to save Phase 1 data');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-6">
        <Link href="/courses">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </Link>
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error || 'Course not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/courses">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>
      </Link>

      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{course.title}</h2>
        <p className="text-muted-foreground mt-1">
          Phase {currentPhase} of 7 - Course Development Wizard
        </p>
      </div>

      {/* Wizard Stepper */}
      <WizardStepper
        currentPhase={currentPhase}
        completedPhases={wizardPhase?.completed_phases || []}
      />

      {/* Phase Content */}
      <div className="mt-8">
        {currentPhase === 1 && (
          <Phase1IdeaCapture
            onSubmit={handlePhase1Submit}
            initialData={{
              title: course.title,
              description: course.description,
              targetAudience: course.target_audience,
              learningObjectives: course.learning_objectives,
              estimatedDuration: course.estimated_duration,
              deliveryFormat: course.delivery_format,
              priority: course.priority,
            }}
          />
        )}

        {currentPhase === 2 && (
          <Phase2ResourceTeam courseId={params.id} />
        )}

        {currentPhase === 3 && (
          <div className="rounded-md border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Phase 3: Branding & Style</p>
            <p className="text-sm text-muted-foreground mt-2">Coming soon...</p>
          </div>
        )}

        {currentPhase === 4 && (
          <div className="rounded-md border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Phase 4: AI-Generated Outline</p>
            <p className="text-sm text-muted-foreground mt-2">Coming soon...</p>
          </div>
        )}

        {currentPhase === 5 && (
          <div className="rounded-md border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Phase 5: SME Questions</p>
            <p className="text-sm text-muted-foreground mt-2">Coming soon...</p>
          </div>
        )}

        {currentPhase === 6 && (
          <div className="rounded-md border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Phase 6: Final Outline</p>
            <p className="text-sm text-muted-foreground mt-2">Coming soon...</p>
          </div>
        )}

        {currentPhase === 7 && (
          <div className="rounded-md border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Phase 7: Content Generation</p>
            <p className="text-sm text-muted-foreground mt-2">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
