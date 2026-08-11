import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Workflow Builder',
  description: 'Visual AI Workflow Builder and Manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout-container">
          <aside className="sidebar">
            <div className="sidebar-logo">AI Workflow Builder</div>
            <nav className="sidebar-nav">
              <Link href="/" className="sidebar-link">Dashboard</Link>
              <Link href="/workflows" className="sidebar-link">Workflows</Link>
              <Link href="/org" className="sidebar-link">Organization</Link>
            </nav>
          </aside>
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}