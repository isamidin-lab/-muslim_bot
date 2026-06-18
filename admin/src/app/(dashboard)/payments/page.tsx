'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/payments', { headers }).then(r => r.ok ? r.json() : { data: { data: [] } }),
      fetch('/api/payments/revenue', { headers }).then(r => r.ok ? r.json() : { data: {} }),
    ])
      .then(([p, r]) => {
        setPayments(p.data?.data || []);
        setRevenue(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => s === 'COMPLETED' ? 'default' : s === 'PENDING' ? 'secondary' : 'destructive';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">{formatCurrency(revenue.totalRevenue || 0)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Sales</p><p className="text-2xl font-bold">{revenue.totalSales || 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Order Value</p><p className="text-2xl font-bold">{formatCurrency(revenue.averageOrderValue || 0)}</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Provider</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow> :
                payments.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground"><DollarSign size={24} className="mx-auto mb-2 opacity-50" />No payments yet</TableCell></TableRow> :
                payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.user?.firstName} {p.user?.lastName}</TableCell>
                    <TableCell>{p.membership?.name || '—'}</TableCell>
                    <TableCell>{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.provider}</TableCell>
                    <TableCell><Badge variant={statusColor(p.status) as any}>{p.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
