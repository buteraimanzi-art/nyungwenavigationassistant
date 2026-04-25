import { useEffect, useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ParkHeader } from '@/components/park/ParkHeader';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { trails } from '@/lib/trail-data';
import { KeyRound, Loader2, Plus, ShieldAlert, ShieldCheck, Trash2, Users, Copy, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type Code = Database['public']['Tables']['trail_access_codes']['Row'];
type Redemption = Database['public']['Tables']['trail_redemptions']['Row'];

function randomCode(prefix: string) {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix.toUpperCase().slice(0, 8)}-${n}`;
}

export default function AdminCodes() {
  const { user, isAdmin, loading } = useAuth();
  const [codes, setCodes] = useState<Code[] | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [trailFilter, setTrailFilter] = useState<string>('all');
  const [creating, setCreating] = useState(false);
  const [openRedemptionsFor, setOpenRedemptionsFor] = useState<Code | null>(null);

  // Form state
  const [formTrailId, setFormTrailId] = useState<string>('');
  const [formCode, setFormCode] = useState('');
  const [formNote, setFormNote] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    Promise.all([
      supabase.from('trail_access_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('trail_redemptions').select('*').order('redeemed_at', { ascending: false }),
    ]).then(([c, r]) => {
      if (cancelled) return;
      if (c.error) toast.error(c.error.message);
      if (r.error) toast.error(r.error.message);
      setCodes(c.data ?? []);
      setRedemptions(r.data ?? []);
    });

    const ch = supabase
      .channel('trail_codes_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trail_access_codes' }, (p) => {
        setCodes((prev) => {
          const list = prev ?? [];
          if (p.eventType === 'INSERT') return [p.new as Code, ...list];
          if (p.eventType === 'UPDATE') return list.map((x) => (x.id === (p.new as Code).id ? (p.new as Code) : x));
          if (p.eventType === 'DELETE') return list.filter((x) => x.id !== (p.old as Code).id);
          return list;
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trail_redemptions' }, (p) => {
        setRedemptions((prev) => [p.new as Redemption, ...prev]);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [isAdmin]);

  const visibleCodes = useMemo(() => {
    const list = codes ?? [];
    if (trailFilter === 'all') return list;
    return list.filter((c) => c.trail_id === trailFilter);
  }, [codes, trailFilter]);

  const redemptionCountByCode = useMemo(() => {
    const m = new Map<string, number>();
    redemptions.forEach((r) => m.set(r.code_id, (m.get(r.code_id) ?? 0) + 1));
    return m;
  }, [redemptions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <ParkHeader />
        <div className="container px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-primary" /> Admin only
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Trail access codes can only be managed by park administrators.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTrailId) return toast.error('Choose a trail');
    const trail = trails.find((t) => t.id === formTrailId);
    if (!trail) return toast.error('Trail not found');
    const value = (formCode.trim() || randomCode(trail.name)).toUpperCase();
    setCreating(true);
    const { error } = await supabase.from('trail_access_codes').insert({
      trail_id: trail.id,
      trail_name: trail.name,
      code: value,
      note: formNote.trim() || null,
      active: true,
      created_by: user.id,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Code already exists' : error.message);
      return;
    }
    toast.success(`Code ${value} created`);
    setFormCode('');
    setFormNote('');
  };

  const generateBatch = async (count: number) => {
    if (!formTrailId) return toast.error('Choose a trail first');
    const trail = trails.find((t) => t.id === formTrailId);
    if (!trail) return;
    const rows = Array.from({ length: count }, () => ({
      trail_id: trail.id,
      trail_name: trail.name,
      code: randomCode(trail.name),
      note: formNote.trim() || null,
      active: true,
      created_by: user.id,
    }));
    const { error } = await supabase.from('trail_access_codes').insert(rows);
    if (error) toast.error(error.message);
    else toast.success(`Generated ${count} codes`);
  };

  const toggleActive = async (c: Code) => {
    const { error } = await supabase
      .from('trail_access_codes')
      .update({ active: !c.active })
      .eq('id', c.id);
    if (error) toast.error(error.message);
  };

  const deleteCode = async (c: Code) => {
    if (!confirm(`Delete code ${c.code}? This also removes its redemption history.`)) return;
    const { error } = await supabase.from('trail_access_codes').delete().eq('id', c.id);
    if (error) toast.error(error.message);
    else toast.success('Code deleted');
  };

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt).then(() => toast.success('Copied'));
  };

  return (
    <div className="min-h-screen bg-background">
      <ParkHeader />
      <div className="container px-4 py-6 md:py-10 space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-primary" /> Trail access codes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Issue and manage the codes hikers use to unlock each trail.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/admin/hikers"><Radio className="h-4 w-4" />Live hikers</Link>
          </Button>
        </div>

        {/* Create form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitCode} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Trail</Label>
                <Select value={formTrailId} onValueChange={setFormTrailId}>
                  <SelectTrigger><SelectValue placeholder="Select trail" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {trails.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Code (leave blank to auto-generate)</Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. NDAMBA-7421"
                  className="font-mono uppercase"
                  maxLength={32}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Note (optional)</Label>
                <Input value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="Group, ticket #, etc." />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating} className="gap-1.5">
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </Button>
                <Button type="button" variant="outline" onClick={() => generateBatch(5)} disabled={!formTrailId}>
                  Generate 5
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Label className="text-xs text-muted-foreground">Filter by trail:</Label>
          <Select value={trailFilter} onValueChange={setTrailFilter}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All trails</SelectItem>
              {trails.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">
            {visibleCodes.length} codes • {redemptions.length} total redemptions
          </span>
        </div>

        {/* Codes table */}
        <Card>
          <CardContent className="p-0">
            {codes === null ? (
              <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : visibleCodes.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No codes yet. Create one above.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Trail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleCodes.map((c) => {
                    const used = redemptionCountByCode.get(c.id) ?? 0;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <button onClick={() => copy(c.code)} className="font-mono text-sm hover:text-primary inline-flex items-center gap-1.5">
                            {c.code}<Copy className="h-3 w-3 opacity-50" />
                          </button>
                        </TableCell>
                        <TableCell className="text-sm">{c.trail_name}</TableCell>
                        <TableCell>
                          {c.active ? (
                            <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3" />Active</Badge>
                          ) : (
                            <Badge variant="secondary">Revoked</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            disabled={used === 0}
                            onClick={() => setOpenRedemptionsFor(c)}
                            className="text-sm inline-flex items-center gap-1.5 hover:text-primary disabled:opacity-60 disabled:hover:text-foreground"
                          >
                            <Users className="h-3.5 w-3.5" />{used}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{c.note ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => toggleActive(c)}>
                              {c.active ? 'Revoke' : 'Re-enable'}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteCode(c)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Redemptions dialog */}
      <Dialog open={!!openRedemptionsFor} onOpenChange={(o) => !o && setOpenRedemptionsFor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">{openRedemptionsFor?.code}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-2">Hikers who unlocked {openRedemptionsFor?.trail_name}</div>
          <div className="max-h-80 overflow-auto -mx-6 px-6 divide-y divide-border">
            {redemptions
              .filter((r) => r.code_id === openRedemptionsFor?.id)
              .map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground truncate">{r.user_id.slice(0, 8)}…</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.redeemed_at), { addSuffix: true })}</span>
                </div>
              ))}
            {redemptions.filter((r) => r.code_id === openRedemptionsFor?.id).length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">Not redeemed yet.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
