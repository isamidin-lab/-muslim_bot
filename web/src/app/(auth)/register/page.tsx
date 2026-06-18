'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', tenantId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/tenants/demo-academy').then(r => r.json()).then(d => {
      if (d.success) setTenants([d.data]);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.register(form);
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.push('/dashboard');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-500 mt-2">Start your learning journey today</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium text-gray-700">First Name</label><input type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Last Name</label><input type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Password</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            {tenants.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Academy</label>
                <select value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} required className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select academy</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
            {tenants.length === 0 && <input type="hidden" value={form.tenantId} />}
            <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <Link href="/login" className="text-emerald-600 font-semibold hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
