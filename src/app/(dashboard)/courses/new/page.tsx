'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { Phase1IdeaCapture } from '@/components/wizard/Phase1IdeaCapture';
import { createCourse } from '../actions';

export default function NewCoursePage() {
  const router = useRouter();

  const handlePhase1Submit = async (data: any) => {
    const result = await createCourse(data);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create course');
    }

    // Redirect to Phase 2 (which we'll build next)
    // For now, redirect back to courses list
    router.push(`/courses`);
    router.refresh();
  };

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
        <h2 className="text-3xl font-bold tracking-tight">Create New Course</h2>
        <p className="text-muted-foreground mt-1">
          Follow the 7-phase wizard to create your course with AI assistance
        </p>
      </div>

      {/* Wizard Stepper */}
      <WizardStepper currentPhase={1} completedPhases={[]} />

      {/* Phase 1 Form */}
      <Phase1IdeaCapture onSubmit={handlePhase1Submit} />
    </div>
  );
}
