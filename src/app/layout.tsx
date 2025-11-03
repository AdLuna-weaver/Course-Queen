import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Course Planner - AI-Powered Course Development',
  description: 'Create and manage training courses with AI assistance',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
