import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ParkHeader } from '@/components/park/ParkHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, ShieldCheck, Siren, KeyRound, Radio, Users,
  AlertTriangle, MapPin, ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Stats {
  activeAlerts: number;
  totalAlerts: number;
  liveHikers: number;
  totalCodes: number;
  activeCodes: number;
  redemptions: number;
  users: number;
}

const EMPTY: Stats = {
  activeAlerts: 0, totalAlerts: 0, liveHikers: 0,
  totalCodes: 0, activeCodes: 0, redemptions: 0, users: 0,
};

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const FIVE_MIN_AGO = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const load = async () => {
      const [alertsAll, alertsActive, hikers, codesAll, codesActive, redemptions, profiles, recent] =
        await Promise.all([
          supabase.from('emergency_alerts').select('id', { count: 'exact', head: true }),
          supabase.from('emergency_alerts').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
          supabase.from('user_locations').select('user_id', { count: 'exact', head: true }).gte('updated_at', FIVE_MIN_AGO),
          supabase.from('trail_access_codes').select('id', { count: 'exact', head: true }),
          supabase.from('trail_access_codes').select('id', { count: 'exact', head: true }).eq('active', true),
          supabase.from('trail_redemptions').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('emergency_alerts').select('*').order('created_at', { ascending: false }).limit(5),
        ]);

      setStats({
        totalAlerts: alertsAll.count ?? 0,
        activeAlerts: alertsActive.count ?? 0,
        liveHikers: hikers.count ?? 0,
        totalCodes: codesAll.count ?? 0,
        activeCodes: codesActive.count ?? 0,
        redemptions: redemptions.count ?? 0,
        users: profiles.count ?? 0,
      });
      setRecentAlerts(recent.data ?? []);
      setLoadingStats(false);
    };

    load();
    const interval = setInterval(load, 15_000);

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_alerts' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, load)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

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
      <div className="min-h-screen flex flex-col bg-background">
        <ParkHeader />
        <main className="flex-1 container px-4 md:px-8 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Admin only</CardTitle>
              <CardDescription>You need administrator privileges to view this page.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container px-4 md:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <ShieldCheck className="w-4 h-4" /> Admin console
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
              Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor emergencies, manage trail access, and track hikers live across Nyungwe.
            </p>
          </div>
          {stats.activeAlerts > 0 && (
            <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-sm self-start">
              <Siren className="w-4 h-4" /> {stats.activeAlerts} active alert{stats.activeAlerts > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Active alerts"
            value={loadingStats ? '—' : stats.activeAlerts}
            sub={`${stats.totalAlerts} all-time`}
            tone={stats.activeAlerts > 0 ? 'danger' : 'default'}
          />
          <StatCard
            icon={<Radio className="w-5 h-5" />}
            label="Live hikers"
            value={loadingStats ? '—' : stats.liveHikers}
            sub="Last 5 min"
          />
          <StatCard
            icon={<KeyRound className="w-5 h-5" />}
            label="Active codes"
            value={loadingStats ? '—' : stats.activeCodes}
            sub={`${stats.totalCodes} total · ${stats.redemptions} redemptions`}
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Registered users"
            value={loadingStats ? '—' : stats.users}
            sub="All profiles"
          />
        </div>

        {/* Action grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <ActionCard
            to="/admin/alerts"
            icon={<Siren className="w-5 h-5" />}
            title="Emergency portal"
            description="View, acknowledge and resolve SOS alerts on a live map."
            badge={stats.activeAlerts > 0 ? `${stats.activeAlerts} new` : undefined}
            badgeTone="danger"
          />
          <ActionCard
            to="/admin/codes"
            icon={<KeyRound className="w-5 h-5" />}
            title="Trail access codes"
            description="Create, generate and revoke codes. See who redeemed them."
          />
          <ActionCard
            to="/admin/hikers"
            icon={<MapPin className="w-5 h-5" />}
            title="Live hikers"
            description="Track each hiker's real-time GPS location across the park."
            badge={stats.liveHikers > 0 ? `${stats.liveHikers} live` : undefined}
          />
        </div>

        {/* Recent alerts */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Recent emergency alerts</CardTitle>
              <CardDescription>The latest 5 SOS reports from hikers.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/alerts">Open portal <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No emergency alerts yet. The portal will light up here as soon as one comes in.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentAlerts.map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{a.issue_type}</span>
                        <Badge
                          variant={a.status === 'new' ? 'destructive' : a.status === 'acknowledged' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {a.status}
                        </Badge>
                        {a.trail_name && (
                          <span className="text-xs text-muted-foreground truncate">· {a.trail_name}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        {a.reporter_name ? ` · ${a.reporter_name}` : ''}
                      </p>
                    </div>
                    {a.latitude && a.longitude && (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MapPin className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, tone = 'default',
}: { icon: React.ReactNode; label: string; value: string | number; sub?: string; tone?: 'default' | 'danger' }) {
  return (
    <Card className={tone === 'danger' ? 'border-destructive/50' : ''}>
      <CardContent className="p-5">
        <div className={`flex items-center gap-2 text-xs uppercase tracking-wide ${
          tone === 'danger' ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {icon}
          <span>{label}</span>
        </div>
        <div className="mt-2 text-3xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ActionCard({
  to, icon, title, description, badge, badgeTone,
}: {
  to: string; icon: React.ReactNode; title: string; description: string;
  badge?: string; badgeTone?: 'danger';
}) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-smooth hover:shadow-floaty hover:border-primary/40">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center">
              {icon}
            </div>
            {badge && (
              <Badge variant={badgeTone === 'danger' ? 'destructive' : 'secondary'}>{badge}</Badge>
            )}
          </div>
          <CardTitle className="mt-3 text-lg group-hover:text-primary transition-smooth">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-primary font-medium inline-flex items-center gap-1">
            Open <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-smooth" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
