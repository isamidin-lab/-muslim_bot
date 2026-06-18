'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Send, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '' });
  const [error, setError] = useState('');

  const load = () => { setLoading(true); api.getBroadcasts().then(r => setBroadcasts(r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { await api.createBroadcast(form); setDialogOpen(false); load(); } catch (err: any) { setError(err.message); }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Send this broadcast?')) return;
    try { await api.sendBroadcast(id); load(); } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this broadcast?')) return;
    try { await api.deleteBroadcast(id); load(); } catch (err: any) { alert(err.message); }
  };

  const statusBadge = (status: string) => {
    const v = status === 'SENT' ? 'default' : status === 'DRAFT' ? 'secondary' : status === 'SENDING' ? 'outline' : 'destructive';
    return <Badge variant={v as any}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Broadcasts</h1>
        <Button onClick={() => { setForm({ title: '', message: '' }); setDialogOpen(true); }}><Plus size={16} className="mr-2" />New Broadcast</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> :
                broadcasts.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No broadcasts yet</TableCell></TableRow> :
                broadcasts.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell>{statusBadge(b.status || 'DRAFT')}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(b.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {(b.status === 'DRAFT' || !b.status) && <Button variant="ghost" size="icon" onClick={() => handleSend(b.id)}><Send size={16} className="text-green-600" /></Button>}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 size={16} className="text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader><DialogTitle>New Broadcast</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            {error && <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>}
            <div className="space-y-2"><label className="text-sm font-medium">Title</label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Message</label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
