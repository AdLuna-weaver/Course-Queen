'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStep {
  phase: number;
  title: string;
  description: string;
}

const steps: WizardStep[] = [
  { phase: 1, title: 'Course Idea', description: 'Define your course concept' },
  { phase: 2, title: 'Resources & Team', description: 'Upload materials and add team' },
  { phase: 3, title: 'Branding & Style', description: 'Set visual identity' },
  { phase: 4, title: 'AI Outline', description: 'Generate course structure' },
  { phase: 5, title: 'SME Questions', description: 'Expert review questions' },
  { phase: 6, title: 'Final Outline', description: 'Review and refine' },
  { phase: 7, title: 'Generation', description: 'Create course content' },
];

interface WizardStepperProps {
  currentPhase: number;
  completedPhases: number[];
}

export function WizardStepper({ currentPhase, completedPhases }: WizardStepperProps) {
  return (
    <div className="w-full py-6">
      {/* Progress Bar */}
      <div className="relative">
        <div className="absolute left-0 top-5 h-0.5 w-full bg-muted" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${((currentPhase - 1) / 6) * 100}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = completedPhases.includes(step.phase);
            const isCurrent = currentPhase === step.phase;
            const isPast = step.phase < currentPhase;
            const isFuture = step.phase > currentPhase;

            return (
              <div
                key={step.phase}
                className="flex flex-col items-center"
                style={{ width: '14.28%' }}
              >
                {/* Circle */}
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-all',
                    isCurrent && 'border-primary bg-primary text-primary-foreground',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isPast && !isCompleted && 'border-primary',
                    isFuture && 'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.phase}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-foreground',
                      isCompleted && 'text-foreground',
                      isFuture && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
