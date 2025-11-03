import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Course Planner</h2>
        </div>
        <nav className="space-y-2 p-4">
          <Link
            href="/courses"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Courses
          </Link>
          <Link
            href="/resources"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Resources
          </Link>
          <Link
            href="/settings"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            {/* User menu will go here */}
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
