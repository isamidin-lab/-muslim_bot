'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Users as UsersIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getUsers(), api.getUserStats()])
      .then(([u, s]) => { setUsers(u.data?.data || u.data || []); setStats(s.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const roleColors: Record<string, string> = { SYSTEM_ADMIN: 'destructive', TENANT_ADMIN: 'default', SUPPORT: 'secondary', STUDENT: 'outline' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{stats.total || stats.totalUsers || 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">{stats.active || stats.activeUsers || 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">This Period</p><p className="text-2xl font-bold">{stats.newThisPeriod || stats.newUsers || 0}</p></CardContent></Card>
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Telegram</TableHead><TableHead>Last Login</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> :
                users.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground"><UsersIcon size={24} className="mx-auto mb-2 opacity-50" />No users yet</TableCell></TableRow> :
                users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email || '—'}</TableCell>
                    <TableCell><Badge variant={(roleColors[u.role] as any) || 'secondary'}>{u.role}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{u.telegramUsername ? `@${u.telegramUsername}` : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
