'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Tag } from 'lucide-react';

export default function PromocodesPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', discount: '', isPercent: 'true', maxUses: '', code: '' });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    // Try to fetch promotions - endpoint may not exist yet
    fetch('/api/promotions', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.ok ? r.json() : { data: { data: [] } })
      .then(d => setPromos(d.data?.data || d.data || []))
      .catch(() => setPromos([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promocodes</h1>
        <Button onClick={() => { setForm({ name: '', discount: '', isPercent: 'true', maxUses: '', code: '' }); setDialogOpen(true); }}><Plus size={16} className="mr-2" />Add Promo</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Max Uses</TableHead><TableHead>Used</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow> :
                promos.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground"><Tag size={24} className="mx-auto mb-2 opacity-50" />No promocodes yet</TableCell></TableRow> :
                promos.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-sm">{p.codes?.[0]?.code || '—'}</TableCell>
                    <TableCell>{p.discount}{p.isPercent ? '%' : '$'}</TableCell>
                    <TableCell>{p.maxUses || '∞'}</TableCell>
                    <TableCell>{p.usedCount || 0}</TableCell>
                    <TableCell><Badge variant={p.isActive ? 'default' : 'secondary'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader><DialogTitle>New Promocode</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); setDialogOpen(false); }} className="space-y-4 mt-4">
            {error && <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>}
            <div className="space-y-2"><label className="text-sm font-medium">Name</label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Code</label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="LAUNCH20" required /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Discount</label><Input type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} required /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={form.isPercent === 'true'} onChange={() => setForm({...form, isPercent: 'true'})} /> Percent</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={form.isPercent === 'false'} onChange={() => setForm({...form, isPercent: 'false'})} /> Fixed ($)</label>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Max Uses</label><Input type="number" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} placeholder="100" /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
