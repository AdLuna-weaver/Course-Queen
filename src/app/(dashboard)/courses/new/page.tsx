import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCoursePage() {
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
          Start creating your course with our AI-powered 7-phase wizard
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardHeader>
          <CardTitle>Course Creation Wizard</CardTitle>
          <CardDescription>
            This feature is coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The course creation wizard will guide you through 7 phases:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Idea Capture - Define your course concept and objectives</li>
            <li>Resource & Team Assembly - Upload materials and add team members</li>
            <li>Branding & Style - Set your course's look and feel</li>
            <li>AI-Generated Outline - Let AI create your course structure</li>
            <li>SME Questions - Answer expert questions to refine content</li>
            <li>Final Outline Refinement - Review and adjust the outline</li>
            <li>Content Generation - Generate complete course content with AI</li>
          </ol>
          <div className="pt-4">
            <Link href="/courses">
              <Button>Return to Courses</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
