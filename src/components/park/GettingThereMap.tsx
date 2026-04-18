import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RECEPTIONS } from '@/lib/receptions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, Car, MapPin, Clock, Navigation, Loader2, LocateFixed, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Major tourist origin points in Rwanda
interface Origin {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  type: 'airport' | 'city' | 'user';
  description: string;
  color: string;
}

const STATIC_ORIGINS: Origin[] = [
  {
    id: 'kigali',
    name: 'Kigali (Capital & Airport)',
    coordinates: { lat: -1.9706, lng: 30.1044 },
    type: 'airport',
    description: 'Kigali International Airport (KGL). Most international tourists start here.',
    color: '#dc2626',
  },
  {
    id: 'huye',
    name: 'Huye (Butare)',
    coordinates: { lat: -2.5959, lng: 29.7395 },
    type: 'city',
    description: 'Major southern city, common stopover en route to Nyungwe.',
    color: '#ea580c',
  },
  {
    id: 'rusizi',
    name: 'Rusizi (Cyangugu)',
    coordinates: { lat: -2.4847, lng: 28.9075 },
    type: 'city',
    description: 'Lake Kivu border town near Gisakura HQ — closest city to the park.',
    color: '#0284c7',
  },
  {
    id: 'musanze',
    name: 'Musanze (Ruhengeri)',
    coordinates: { lat: -1.4995, lng: 29.6336 },
    type: 'city',
    description: 'Northern city, gateway to Volcanoes NP — connects via Kigali.',
    color: '#7c3aed',
  },
];

// Which receptions to route to from each known origin
const DESTINATIONS: Record<string, { receptionId: string; via: string }[]> = {
  kigali: [
    { receptionId: 'reception-uwinka', via: 'Kigali → Muhanga → Huye → Uwinka (RN1 + RN6)' },
    { receptionId: 'reception-gisakura', via: 'Kigali → Huye → Gisakura HQ' },
  ],
  huye: [
    { receptionId: 'reception-uwinka', via: 'Huye → Uwinka (RN6 west)' },
    { receptionId: 'reception-gisakura', via: 'Huye → Gisakura HQ' },
  ],
  rusizi: [
    { receptionId: 'reception-gisakura', via: 'Rusizi → Gisakura HQ (RN6 east)' },
    { receptionId: 'reception-uwinka', via: 'Rusizi → Gisakura → Uwinka' },
  ],
  musanze: [
    { receptionId: 'reception-uwinka', via: 'Musanze → Kigali → Huye → Uwinka' },
    { receptionId: 'reception-gisakura', via: 'Musanze → Kigali → Huye → Gisakura' },
  ],
};

interface RoadRoute {
  receptionId: string;
  via: string;
  coords: [number, number][]; // [lat, lng]
  distanceKm: number;
  durationHrs: number;
}

const RWANDA_CENTER: [number, number] = [-2.0, 29.7];

// Cache OSRM responses in-memory across renders
const routeCache = new Map<string, RoadRoute>();

// Multiple OSRM-compatible endpoints — fall back if one is down/blocked
const OSRM_ENDPOINTS = [
  'https://routing.openstreetmap.de/routed-car/route/v1',
  'https://router.project-osrm.org/route/v1',
];

async function fetchOsrmRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ coords: [number, number][]; distanceKm: number; durationHrs: number } | null> {
  for (const base of OSRM_ENDPOINTS) {
    const url = `${base}/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) continue;
      const coords: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng],
      );
      return {
        coords,
        distanceKm: route.distance / 1000,
        durationHrs: route.duration / 3600,
      };
    } catch {
      continue;
    }
  }
  // Final fallback: straight-line estimate so the user still sees a route
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const distanceKm = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.35; // road factor
  return {
    coords: [[from.lat, from.lng], [to.lat, to.lng]],
    distanceKm,
    durationHrs: distanceKm / 55, // avg 55 km/h on Rwandan roads
  };
}

function createOriginIcon(color: string, isAirport: boolean, isActive: boolean, isUser = false) {
  const size = isActive ? 40 : 32;
  const symbol = isUser ? '★' : isAirport ? '✈' : '●';
  const ring = isUser ? `box-shadow:0 0 0 4px ${color}33, 0 2px 10px rgba(0,0,0,0.35);` : 'box-shadow:0 2px 10px rgba(0,0,0,0.35);';
  return L.divIcon({
    html: `<div style="background:${color};color:white;border-radius:9999px;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size * 0.5)}px;border:3px solid white;${ring}">${symbol}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const parkIcon = L.divIcon({
  html: `<div style="background:#15803d;color:white;border-radius:9999px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);">PARK</div>`,
  className: '',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

export function GettingThereMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [userOrigin, setUserOrigin] = useState<Origin | null>(null);
  const [activeOrigin, setActiveOrigin] = useState<string>('kigali');
  const [routes, setRoutes] = useState<RoadRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const origins: Origin[] = userOrigin ? [userOrigin, ...STATIC_ORIGINS] : STATIC_ORIGINS;

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation unavailable', description: 'Your browser does not support location.', variant: 'destructive' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newOrigin: Origin = {
          id: 'my-location',
          name: 'My Current Location',
          coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          type: 'user',
          description: `Your live GPS position (±${Math.round(pos.coords.accuracy)}m). Real road directions to all 3 park receptions.`,
          color: '#0ea5e9',
        };
        setUserOrigin(newOrigin);
        setActiveOrigin('my-location');
        setLocating(false);
        toast({ title: 'Location found', description: 'Calculating real road routes from your position…' });
      },
      (err) => {
        setLocating(false);
        const msg = err.code === 1
          ? 'Permission denied. Please allow location access in your browser.'
          : err.code === 2 ? 'Position unavailable. Check your GPS.' : 'Location request timed out.';
        toast({ title: 'Could not get location', description: msg, variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: RWANDA_CENTER,
      zoom: 9,
      minZoom: 3,
      maxZoom: 16,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Fetch routes from OSRM whenever the active origin changes
  useEffect(() => {
    const origin = origins.find((o) => o.id === activeOrigin);
    if (!origin) return;

    const dests = activeOrigin === 'my-location'
      ? RECEPTIONS.map((r) => ({ receptionId: r.id, via: `Your location → ${r.name} (real roads)` }))
      : (DESTINATIONS[activeOrigin] || []);
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const results: RoadRoute[] = [];
      for (const d of dests) {
        const reception = RECEPTIONS.find((r) => r.id === d.receptionId);
        if (!reception) continue;
        const cacheKey = `${activeOrigin}:${origin.coordinates.lat.toFixed(4)},${origin.coordinates.lng.toFixed(4)}->${d.receptionId}`;
        let cached = routeCache.get(cacheKey);
        if (!cached) {
          const fetched = await fetchOsrmRoute(origin.coordinates, reception.coordinates);
          if (fetched) {
            cached = { receptionId: d.receptionId, via: d.via, ...fetched };
            routeCache.set(cacheKey, cached);
          }
        }
        if (cached) results.push(cached);
      }
      if (cancelled) return;
      if (results.length === 0) {
        setError('Could not calculate routes. Please check your connection.');
      } else if (results.every((r) => r.coords.length <= 2)) {
        setError('Live road routing is unavailable right now — showing straight-line estimates.');
      }
      results.sort((a, b) => a.distanceKm - b.distanceKm);
      setRoutes(results);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrigin, userOrigin?.coordinates.lat, userOrigin?.coordinates.lng]);

  // Render markers + polylines
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    RECEPTIONS.forEach((r) => {
      L.marker([r.coordinates.lat, r.coordinates.lng], { icon: parkIcon })
        .bindPopup(`<strong>${r.name}</strong><br/><span style="font-size:12px;">Park entrance</span>`)
        .addTo(layer);
    });

    origins.forEach((o) => {
      const icon = createOriginIcon(o.color, o.type === 'airport', o.id === activeOrigin, o.type === 'user');
      L.marker([o.coordinates.lat, o.coordinates.lng], { icon })
        .bindPopup(`<strong>${o.name}</strong><br/><span style="font-size:12px;">${o.description}</span>`)
        .addTo(layer);
    });

    const allCoords: [number, number][] = [];
    routes.forEach((route, idx) => {
      L.polyline(route.coords, {
        color: idx === 0 ? '#16a34a' : '#2563eb',
        weight: 5,
        opacity: 0.85,
        dashArray: idx === 0 ? undefined : '10 6',
      })
        .bindPopup(
          `<div style="font-size:12px;"><strong>${route.via}</strong><br/>${route.distanceKm.toFixed(0)} km · ~${route.durationHrs.toFixed(1)}h drive<br/><em>Real road route via OSRM</em></div>`,
        )
        .addTo(layer);
      allCoords.push(...route.coords);
    });

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrigin, routes, userOrigin]);

  const active = origins.find((o) => o.id === activeOrigin);
  const isUserActive = activeOrigin === 'my-location';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={isUserActive ? 'default' : 'secondary'}
          size="sm"
          onClick={handleUseMyLocation}
          className="gap-2"
          disabled={locating || loading}
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          {userOrigin ? 'Update My Location' : 'Use My Current Location'}
        </Button>
        {userOrigin && !isUserActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveOrigin('my-location')}
            className="gap-2"
            disabled={loading}
          >
            <MapPin className="w-4 h-4" />
            From My Location
          </Button>
        )}
        {STATIC_ORIGINS.map((o) => (
          <Button
            key={o.id}
            variant={activeOrigin === o.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveOrigin(o.id)}
            className="gap-2"
            disabled={loading}
          >
            {o.type === 'airport' ? <Plane className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            From {o.name.split(' (')[0]}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative h-[480px] w-full overflow-hidden rounded-lg border border-border bg-muted">
          <div ref={containerRef} className="h-full w-full" />
          {loading && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Loading real road routes…
            </div>
          )}
        </div>

        <Card className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              From {active?.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{active?.description}</p>
          </div>

          {!userOrigin && (
            <div className="text-xs bg-primary/10 border border-primary/30 rounded-lg p-2 text-foreground">
              📍 <strong>Tip:</strong> Tap <em>"Use My Current Location"</em> to get real road directions from where you are right now to all 3 park entrances.
            </div>
          )}

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {loading && routes.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Calculating real road routes…
              </div>
            )}
            {routes.map((route, idx) => {
              const dest = RECEPTIONS.find((r) => r.id === route.receptionId);
              const origin = origins.find((o) => o.id === activeOrigin);
              const isAppleDevice = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
              const originParam = origin && activeOrigin === 'my-location'
                ? `${origin.coordinates.lat},${origin.coordinates.lng}`
                : origin
                  ? `${origin.coordinates.lat},${origin.coordinates.lng}`
                  : '';
              const destParam = dest ? `${dest.coordinates.lat},${dest.coordinates.lng}` : '';
              const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`;
              const appleMapsUrl = `https://maps.apple.com/?saddr=${originParam}&daddr=${destParam}&dirflg=d`;
              return (
                <div key={idx} className="border border-border rounded-lg p-3 bg-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-medium text-sm">→ {dest?.name}</div>
                    {idx === 0 && (
                      <span className="text-[10px] uppercase tracking-wide font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        Closest
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{route.via}</p>
                  <div className="flex items-center gap-3 text-xs mb-3">
                    <span className="flex items-center gap-1 text-foreground">
                      <Car className="w-3 h-3" /> {route.distanceKm.toFixed(0)} km
                    </span>
                    <span className="flex items-center gap-1 text-foreground">
                      <Clock className="w-3 h-3" /> ~{route.durationHrs.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant={idx === 0 ? 'default' : 'outline'}
                      className="gap-1.5 h-8 text-xs flex-1"
                    >
                      <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">
                        <Navigation className="w-3.5 h-3.5" />
                        Open in Google Maps
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </Button>
                    {isAppleDevice && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs"
                      >
                        <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer">
                          <MapPin className="w-3.5 h-3.5" />
                          Apple Maps
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              💡 Routes are calculated on real roads via OpenStreetMap (OSRM). {isUserActive ? 'Showing routes from your live GPS position to all 3 park entrances.' : 'Most tourists fly into Kigali (KGL) and drive ~6h via Huye.'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
