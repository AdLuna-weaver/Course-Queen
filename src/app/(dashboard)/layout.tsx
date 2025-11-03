import { redirect } from 'next/navigation';
import { getUser } from '@/app/(auth)/actions';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
