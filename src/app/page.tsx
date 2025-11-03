import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight">
          Course Planner
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-Powered Course Development Platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/courses">
            <Button size="lg" variant="outline">
              View Courses
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
