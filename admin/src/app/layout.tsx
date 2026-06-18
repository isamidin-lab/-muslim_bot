import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Muslim Bot Admin', description: 'Admin panel for Muslim Bot platform' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
