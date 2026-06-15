import { useEffect, useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ParkHeader } from '@/components/park/ParkHeader';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Loader2, MapPin, Radio, ShieldAlert, KeyRound } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NYUNGWE_POLYGON_LATLNG } from '@/lib/nyungwe-boundary';
import { useEffect as useEffectMap, useRef } from 'react';

type Hiker = Database['public']['Tables']['user_locations']['Row'];
type Identity = { email: string | null; full_name: string | null };

// Deterministic color from user id (golden-angle hue)
function colorForUser(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const hue = (hash * 137.508) % 360;
  return `hsl(${hue.toFixed(0)}, 75%, 45%)`;
}

function labelForHiker(id: string, ident?: Identity): string {
  if (ident?.full_name && ident.full_name.trim()) return ident.full_name.trim();
  if (ident?.email) return ident.email;
  return `User ${id.slice(0, 8)}…`;
}

const PARK_CENTER: [number, number] = [-2.45, 29.25];

function HikerMap({ hikers, identities }: { hikers: Hiker[]; identities: Record<string, Identity> }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffectMap(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: PARK_CENTER, zoom: 11 });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri', maxZoom: 19,
    }).addTo(map);
    L.polygon(NYUNGWE_POLYGON_LATLNG, { color: '#16a34a', weight: 2, fillOpacity: 0.05, dashArray: '6 6' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);

  useEffectMap(() => {
    const map = mapRef.current; const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (hikers.length === 0) return;
    hikers.forEach((h) => {
      const ageMs = Date.now() - new Date(h.updated_at).getTime();
      const stale = ageMs > 5 * 60_000;
      const color = stale ? '#94a3b8' : colorForUser(h.user_id);
      const ident = identities[h.user_id];
      const label = labelForHiker(h.user_id, ident);
      const initial = (label[0] ?? '?').toUpperCase();
      const safeLabel = label.replace(/</g, '&lt;');
      const icon = L.divIcon({
        html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translateY(-6px);">
          <div style="position:relative;width:28px;height:28px;">
            ${stale ? '' : `<span style="position:absolute;inset:-7px;border-radius:9999px;background:${color};opacity:0.35;animation:hikerPulse 1.6s ease-out infinite"></span>`}
            <div style="position:relative;background:${color};color:white;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)">${initial}</div>
          </div>
          <div style="margin-top:4px;background:white;color:#0f172a;font-size:11px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid ${color};max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 3px rgba(0,0,0,0.2)">${safeLabel}</div>
        </div><style>@keyframes hikerPulse{0%{transform:scale(1);opacity:0.45}100%{transform:scale(2.4);opacity:0}}</style>`,
        className: '', iconSize: [160, 56], iconAnchor: [80, 14],
      });
      const emailLine = ident?.email ? `<br/><span style="font-size:11px;color:#64748b">${ident.email}</span>` : '';
      L.marker([h.latitude, h.longitude], { icon })
        .bindPopup(`<div style="font-family:inherit;min-width:160px"><b style="color:${color}">${safeLabel}</b>${emailLine}<br/><span style="font-size:11px">${h.trail_name ?? 'No trail'}</span><br/><span style="font-size:11px;color:#64748b">${stale ? 'Last seen' : 'Updated'} ${new Date(h.updated_at).toLocaleTimeString()}</span></div>`)
        .addTo(layer);
    });
    if (hikers.length === 1) {
      map.setView([hikers[0].latitude, hikers[0].longitude], 14);
    } else {
      const bounds = L.latLngBounds(hikers.map((h) => [h.latitude, h.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [hikers, identities]);

  return <div className="relative w-full h-[480px] rounded-lg overflow-hidden border border-border"><div ref={containerRef} className="absolute inset-0" /></div>;
}

export default function AdminHikers() {
  const { user, isAdmin, loading } = useAuth();
  const [hikers, setHikers] = useState<Hiker[] | null>(null);
  const [identities, setIdentities] = useState<Record<string, Identity>>({});

  // Fetch identities for any user ids we don't yet have
  useEffect(() => {
    if (!isAdmin || !hikers || hikers.length === 0) return;
    const missing = hikers.map((h) => h.user_id).filter((id) => !(id in identities));
    if (missing.length === 0) return;
    let cancelled = false;
    (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: { user_id: string; email: string | null; full_name: string | null }[] | null }>)
      ('admin_get_hiker_identities', { _ids: missing })
      .then(({ data }) => {
        if (cancelled || !data) return;
        setIdentities((prev) => {
          const next = { ...prev };
          for (const id of missing) next[id] = { email: null, full_name: null };
          for (const row of data) next[row.user_id] = { email: row.email, full_name: row.full_name };
          return next;
        });
      });
    return () => { cancelled = true; };
  }, [hikers, isAdmin, identities]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    supabase
      .from('user_locations')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }) => { if (!cancelled) setHikers(data ?? []); });

    const ch = supabase
      .channel('user_locations_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, (p) => {
        setHikers((prev) => {
          const list = prev ?? [];
          if (p.eventType === 'DELETE') return list.filter((x) => x.user_id !== (p.old as Hiker).user_id);
          const next = p.new as Hiker;
          const filtered = list.filter((x) => x.user_id !== next.user_id);
          return [next, ...filtered];
        });
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [isAdmin]);

  // Tick every 30s so "last seen" labels stay fresh
  const [, setNow] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNow((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const active = useMemo(() => (hikers ?? []).filter((h) => Date.now() - new Date(h.updated_at).getTime() < 5 * 60_000), [hikers]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <ParkHeader />
        <div className="container px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-4 w-4 text-primary" /> Admin only</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Hiker tracking is restricted to park administrators.</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container px-4 py-6 md:py-10 space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Radio className="h-6 w-6 text-primary" /> Live hikers
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time positions of hikers currently using the app.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-white animate-pulse" />{active.length} active</Badge>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/admin/codes"><KeyRound className="h-4 w-4" />Access codes</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Map</CardTitle>
          </CardHeader>
          <CardContent>
            <HikerMap hikers={hikers ?? []} />
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />Active (&lt; 5 min)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />Stale</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">All hikers</CardTitle></CardHeader>
          <CardContent>
            {hikers === null ? (
              <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : hikers.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No hikers have shared their location yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {hikers.map((h) => {
                  const stale = Date.now() - new Date(h.updated_at).getTime() > 5 * 60_000;
                  return (
                    <div key={h.user_id} className="py-3 flex items-center gap-3 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full ${stale ? 'bg-muted-foreground' : 'bg-primary animate-pulse'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{h.trail_name ?? 'No trail'}</div>
                        <div className="text-xs text-muted-foreground font-mono">User {h.user_id.slice(0, 8)}…</div>
                      </div>
                      <a href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline whitespace-nowrap">
                        {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                      </a>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(h.updated_at), { addSuffix: true })}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
