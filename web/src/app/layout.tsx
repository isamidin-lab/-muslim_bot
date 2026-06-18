import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Muslim Bot — Learn Arabic & Islamic Studies', description: 'Online courses for Arabic language and Islamic education' };

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">M</div>
            <span className="text-xl font-bold text-emerald-900">Muslim Bot</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/courses" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">Courses</Link>
            <Link href="/my-courses" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">My Courses</Link>
            <Link href="/membership" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">Sign In</Link>
            <Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm">Get Started</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-emerald-900 text-emerald-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-white text-lg mb-3">Muslim Bot</h3>
            <p className="text-emerald-300 text-sm">Online platform for learning Arabic language and Islamic studies. Join thousands of students worldwide.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Platform</h4>
            <div className="space-y-2 text-sm"><Link href="/courses" className="block hover:text-white transition-colors">Courses</Link><Link href="/membership" className="block hover:text-white transition-colors">Pricing</Link></div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Account</h4>
            <div className="space-y-2 text-sm"><Link href="/login" className="block hover:text-white transition-colors">Sign In</Link><Link href="/register" className="block hover:text-white transition-colors">Register</Link></div>
          </div>
        </div>
        <div className="border-t border-emerald-800 mt-8 pt-8 text-center text-sm text-emerald-400">&copy; {new Date().getFullYear()} Muslim Bot. All rights reserved.</div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </body></html>
  );
}
