'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Radio } from 'lucide-react';

export default function ChannelsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ telegramId: '', title: '', username: '' });
  const [error, setError] = useState('');

  const load = () => { setLoading(true); api.getChannels().then(r => setChannels(r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { await api.createChannel(form); setDialogOpen(false); load(); } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this channel?')) return;
    try { await api.deleteChannel(id); load(); } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Telegram Channels</h1>
        <Button onClick={() => { setForm({ telegramId: '', title: '', username: '' }); setDialogOpen(true); }}><Plus size={16} className="mr-2" />Add Channel</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Username</TableHead><TableHead>Telegram ID</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> :
                channels.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground"><Radio size={24} className="mx-auto mb-2 opacity-50" />No channels connected</TableCell></TableRow> :
                channels.map(ch => (
                  <TableRow key={ch.id}>
                    <TableCell className="font-medium">{ch.title}</TableCell>
                    <TableCell className="text-muted-foreground">@{ch.username}</TableCell>
                    <TableCell className="font-mono text-sm">{ch.telegramId}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(ch.id)}><Trash2 size={16} className="text-red-500" /></Button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader><DialogTitle>Add Channel</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>}
            <div className="space-y-2"><label className="text-sm font-medium">Channel Title</label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Username</label><Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="my_channel" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Telegram ID</label><Input value={form.telegramId} onChange={e => setForm({...form, telegramId: e.target.value})} placeholder="-1001234567890" required /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Add</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
