import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ParkHeader } from '@/components/park/ParkHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { AlertTriangle, CheckCircle2, Clock, Loader2, MapPin, Phone, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { AlertsMap } from '@/components/park/AlertsMap';

type Alert = Database['public']['Tables']['emergency_alerts']['Row'];
type Status = Database['public']['Enums']['alert_status'];

const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  acknowledged: 'In progress',
  resolved: 'Resolved',
};

const STATUS_VARIANT: Record<Status, 'destructive' | 'default' | 'secondary'> = {
  new: 'destructive',
  acknowledged: 'default',
  resolved: 'secondary',
};

export default function AdminAlerts() {
  const { user, isAdmin, loading } = useAuth();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    supabase
      .from('emergency_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error(error.message);
        setAlerts(data ?? []);
      });

    const channel = supabase
      .channel('emergency_alerts_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_alerts' },
        (payload) => {
          setAlerts((prev) => {
            const list = prev ?? [];
            if (payload.eventType === 'INSERT') {
              const next = payload.new as Alert;
              toast.warning(`New emergency: ${next.trail_name ?? 'General'} — ${next.issue_type}`);
              return [next, ...list];
            }
            if (payload.eventType === 'UPDATE') {
              const next = payload.new as Alert;
              return list.map((a) => (a.id === next.id ? next : a));
            }
            if (payload.eventType === 'DELETE') {
              const old = payload.old as Alert;
              return list.filter((a) => a.id !== old.id);
            }
            return list;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const visible = useMemo(() => {
    if (!alerts) return [];
    if (filter === 'all') return alerts;
    return alerts.filter((a) => a.status !== 'resolved');
  }, [alerts, filter]);

  const newCount = useMemo(
    () => (alerts ?? []).filter((a) => a.status === 'new').length,
    [alerts],
  );

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
              The emergency portal is restricted to park administrators. Ask a park admin to grant your account the admin role.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const updateStatus = async (id: string, status: Status) => {
    setUpdatingId(id);
    const patch: Partial<Alert> = { status };
    if (status === 'acknowledged') {
      patch.acknowledged_by = user.id;
      patch.acknowledged_at = new Date().toISOString();
    } else if (status === 'resolved') {
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase.from('emergency_alerts').update(patch).eq('id', id);
    setUpdatingId(null);
    if (error) toast.error(error.message);
    else toast.success(`Alert marked ${STATUS_LABEL[status].toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <ParkHeader />
      <div className="container px-4 py-6 md:py-10 space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" /> Emergency portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live SOS alerts sent by hikers in Nyungwe National Park.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {newCount > 0 && (
              <Badge variant="destructive" className="gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                {newCount} new
              </Badge>
            )}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'active' | 'all')}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {alerts === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" /> Live alert map
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {visible.filter((a) => a.latitude != null && a.longitude != null).length} of {visible.length} located
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertsMap alerts={visible} />
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#dc2626]" />New</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />Acknowledged</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#16a34a]" />Resolved</span>
                </div>
              </CardContent>
            </Card>

            {visible.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  No {filter === 'active' ? 'active' : ''} emergency alerts right now.
                </CardContent>
              </Card>
            ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((a) => (
              <Card key={a.id} className={a.status === 'new' ? 'border-destructive/60 shadow-md' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base capitalize">
                        {a.issue_type} — {a.trail_name ?? 'General'}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {a.description && <p className="text-foreground">{a.description}</p>}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {a.reporter_name && (
                      <p><span className="font-medium text-foreground">Reporter:</span> {a.reporter_name}</p>
                    )}
                    {a.latitude != null && a.longitude != null ? (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        <a
                          href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                          target="_blank" rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                        </a>
                        {a.accuracy != null && <span>• ±{Math.round(a.accuracy)}m</span>}
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Location not available</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a href="tel:8006"><Phone className="h-3.5 w-3.5" />Call 8006</a>
                    </Button>
                    {a.status === 'new' && (
                      <Button size="sm" disabled={updatingId === a.id} onClick={() => updateStatus(a.id, 'acknowledged')}>
                        Acknowledge
                      </Button>
                    )}
                    {a.status !== 'resolved' && (
                      <Button size="sm" variant="secondary" disabled={updatingId === a.id} onClick={() => updateStatus(a.id, 'resolved')}>
                        Mark resolved
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
