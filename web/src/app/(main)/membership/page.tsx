'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Check, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function MembershipPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getMemberships().then(r => setPlans(r.data?.data || [])).catch(console.error).finally(() => setLoading(false)); }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Choose Your Plan</h1>
        <p className="text-gray-500 max-w-lg mx-auto">Get access to premium courses, AI tools, and exclusive content.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No membership plans available yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
            const isPopular = idx === 1 || plan.name?.toLowerCase().includes('premium');
            return (
              <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-8 ${isPopular ? 'border-emerald-500 shadow-lg scale-[1.02]' : 'border-gray-100'}`}>
                {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Star size={12} /> Most Popular</div>}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-gray-500 text-sm">/{plan.interval === 'ONE_TIME' ? 'one-time' : plan.interval?.toLowerCase()}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><Check size={16} className="text-emerald-500 mt-0.5 shrink-0" /><span>{f}</span></li>
                  ))}
                </ul>
                <Link href="/register" className={`block w-full text-center py-3 rounded-xl font-semibold transition-colors ${isPopular ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Get Started
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
