import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RECEPTIONS } from '@/lib/receptions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, Car, MapPin, Clock, Navigation, Loader2, LocateFixed } from 'lucide-react';
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
const RWANDA_BOUNDS: L.LatLngBoundsExpression = [[-2.95, 28.8], [-1.0, 30.95]];

// Cache OSRM responses in-memory across renders
const routeCache = new Map<string, RoadRoute>();

async function fetchOsrmRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ coords: [number, number][]; distanceKm: number; durationHrs: number } | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    const coords: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng],
    );
    return {
      coords,
      distanceKm: route.distance / 1000,
      durationHrs: route.duration / 3600,
    };
  } catch {
    return null;
  }
}

function createOriginIcon(color: string, isAirport: boolean, isActive: boolean) {
  const size = isActive ? 40 : 32;
  const symbol = isAirport ? '✈' : '●';
  return L.divIcon({
    html: `<div style="background:${color};color:white;border-radius:9999px;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size * 0.5)}px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);">${symbol}</div>`,
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
  const [activeOrigin, setActiveOrigin] = useState<string>('kigali');
  const [routes, setRoutes] = useState<RoadRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: RWANDA_CENTER,
      zoom: 9,
      minZoom: 7,
      maxZoom: 14,
      maxBounds: RWANDA_BOUNDS,
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
    const origin = ORIGINS.find((o) => o.id === activeOrigin);
    if (!origin) return;
    const dests = DESTINATIONS[activeOrigin] || [];
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const results: RoadRoute[] = [];
      for (const d of dests) {
        const reception = RECEPTIONS.find((r) => r.id === d.receptionId);
        if (!reception) continue;
        const cacheKey = `${activeOrigin}->${d.receptionId}`;
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
        setError('Could not load road routes. Check your connection and try again.');
      }
      setRoutes(results);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeOrigin]);

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

    ORIGINS.forEach((o) => {
      const icon = createOriginIcon(o.color, o.type === 'airport', o.id === activeOrigin);
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
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [activeOrigin, routes]);

  const active = ORIGINS.find((o) => o.id === activeOrigin);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ORIGINS.map((o) => (
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
              return (
                <div key={idx} className="border border-border rounded-lg p-3 bg-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-medium text-sm">→ {dest?.name}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{route.via}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-foreground">
                      <Car className="w-3 h-3" /> {route.distanceKm.toFixed(0)} km
                    </span>
                    <span className="flex items-center gap-1 text-foreground">
                      <Clock className="w-3 h-3" /> ~{route.durationHrs.toFixed(1)}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Routes are calculated on real Rwandan roads via OpenStreetMap (OSRM). Most tourists fly into Kigali (KGL) and drive ~6h via Huye. Domestic flights to Kamembe (Rusizi) cut travel to ~1h total.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
