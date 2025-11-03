import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUser } from '@/app/(auth)/actions';

export default async function HomePage() {
  const user = await getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-background to-muted/40">
      <div className="max-w-5xl w-full text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight">
          Course Planner
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-Powered Course Development Platform
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Create high-quality training courses efficiently with Claude Sonnet 4.5,
          intelligent resource management, and collaborative review workflows.
        </p>
        <div className="flex gap-4 justify-center">
          {user ? (
            <Link href="/courses">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
