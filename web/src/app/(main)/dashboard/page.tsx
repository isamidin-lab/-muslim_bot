'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BookOpen, CreditCard, BarChart3, Settings, LogOut, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function UserDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      api.getDashboard().then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
    }
  }, [authLoading, user]);

  if (authLoading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s your learning overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50"><Settings size={16} />Settings</Link>
          <button onClick={logout} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium text-red-600 hover:bg-red-50"><LogOut size={16} />Sign Out</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3"><div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><BookOpen size={20} /></div><p className="text-sm text-gray-500">Courses</p></div>
          <p className="text-2xl font-bold">{stats?.courseCount || 0}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3"><div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><CreditCard size={20} /></div><p className="text-sm text-gray-500">Active Plans</p></div>
          <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3"><div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center"><BarChart3 size={20} /></div><p className="text-sm text-gray-500">Total Users</p></div>
          <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/courses" className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors">
            <span className="font-medium text-sm">Browse Courses</span><ArrowRight size={16} className="text-emerald-600" />
          </Link>
          <Link href="/membership" className="flex items-center justify-between p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
            <span className="font-medium text-sm">View Plans</span><ArrowRight size={16} className="text-blue-600" />
          </Link>
          <Link href="/settings" className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <span className="font-medium text-sm">Account Settings</span><ArrowRight size={16} className="text-gray-600" />
          </Link>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-bold mb-4">Account Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Name</p><p className="font-medium">{user?.firstName} {user?.lastName}</p></div>
          <div><p className="text-gray-500">Email</p><p className="font-medium">{user?.email || '—'}</p></div>
          <div><p className="text-gray-500">Role</p><p className="font-medium">{user?.role}</p></div>
          <div><p className="text-gray-500">Joined</p><p className="font-medium">{user?.createdAt ? formatDate(user.createdAt) : '—'}</p></div>
        </div>
      </div>
    </div>
  );
}
