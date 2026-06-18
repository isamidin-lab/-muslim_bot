'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, Users, BookOpen, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getCourses()])
      .then(([dash, courses]) => {
        setStats({ ...dash.data, courseCount: courses.data?.data?.length || 0 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const cards = [
    { title: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { title: 'Courses', value: stats?.courseCount || 0, icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
    { title: 'Active Users', value: stats?.activeUsers || 0, icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}><card.icon size={24} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">New users this period</span><span className="font-medium">{stats?.newUsers || 0}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Total sales</span><span className="font-medium">{stats?.totalSales || 0}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Conversion rate</span><span className="font-medium">{stats?.conversionRate || '0%'}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a href="/courses" className="p-4 rounded-lg border hover:bg-gray-50 text-center text-sm font-medium">Manage Courses</a>
              <a href="/memberships" className="p-4 rounded-lg border hover:bg-gray-50 text-center text-sm font-medium">Manage Plans</a>
              <a href="/users" className="p-4 rounded-lg border hover:bg-gray-50 text-center text-sm font-medium">View Users</a>
              <a href="/broadcasts" className="p-4 rounded-lg border hover:bg-gray-50 text-center text-sm font-medium">Send Broadcast</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
