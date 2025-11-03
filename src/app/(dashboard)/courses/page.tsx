import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, BookOpen, Clock, Users } from 'lucide-react';
import Link from 'next/link';

export default function CoursesPage() {
  // TODO: Fetch real courses from Supabase
  const courses: any[] = [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage your training courses with AI assistance
          </p>
        </div>
        <Link href="/courses/new">
          <Button size="lg" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Course
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Get started by creating your first course. Our AI will help you build engaging content step by step.
            </p>
            <Link href="/courses/new">
              <Button size="lg" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Your First Course
              </Button>
            </Link>
            <div className="mt-8 grid grid-cols-3 gap-8 text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span>7-Phase Wizard</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-5 w-5" />
                </div>
                <span>AI-Powered</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Users className="h-5 w-5" />
                </div>
                <span>Collaborative</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Course Grid - Will be shown when courses exist */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {course.status}
                    </CardDescription>
                  </div>
                  <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {course.currentPhase}/7
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description || 'No description'}
                </p>
                
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.moduleCount || 0} modules</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.estimatedDuration || 0} min</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/courses/${course.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/courses/${course.id}/preview`} className="flex-1">
                    <Button size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
