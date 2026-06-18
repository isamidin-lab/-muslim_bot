'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3, DollarSign, Users, BookOpen } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getCourseAnalytics(), api.getPayments()])
      .then(([d, c, p]) => {
        setDashboard(d.data);
        setCourses(c.data?.data || c.data || []);
        setPayments(p.data?.data || p.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">{formatCurrency(dashboard?.totalRevenue || 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Sales</p><p className="text-2xl font-bold">{dashboard?.totalSales || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Users</p><p className="text-2xl font-bold">{dashboard?.totalUsers || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Conversion</p><p className="text-2xl font-bold">{dashboard?.conversionRate || '0%'}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Course Performance</CardTitle></CardHeader>
          <CardContent>
            {courses.length === 0 ? <p className="text-muted-foreground text-sm">No course data yet</p> : (
              <div className="space-y-3">
                {courses.map((c: any) => (
                  <div key={c.id || c.courseId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div><p className="font-medium text-sm">{c.title || c.courseTitle}</p><p className="text-xs text-muted-foreground">{c.studentCount || c._count?.progresses || 0} students</p></div>
                    <p className="text-sm font-bold">{formatCurrency(c.revenue || 0)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
          <CardContent>
            {payments.length === 0 ? <p className="text-muted-foreground text-sm">No payments yet</p> : (
              <div className="space-y-3">
                {payments.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div><p className="text-sm font-medium">{p.method || p.paymentMethod}</p><p className="text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</p></div>
                    <p className="text-sm font-bold">{formatCurrency(p.amount || 0)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
