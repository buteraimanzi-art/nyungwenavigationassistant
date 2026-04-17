import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RECEPTIONS } from '@/lib/receptions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, Car, MapPin, Clock, Navigation } from 'lucide-react';

// Major tourist origin points in Rwanda
const ORIGINS = [
  {
    id: 'kigali',
    name: 'Kigali (Capital & Airport)',
    coordinates: { lat: -1.9706, lng: 30.1044 },
    type: 'airport' as const,
    description: 'Kigali International Airport (KGL). Most international tourists start here.',
    color: '#dc2626',
  },
  {
    id: 'huye',
    name: 'Huye (Butare)',
    coordinates: { lat: -2.5959, lng: 29.7395 },
    type: 'city' as const,
    description: 'Major southern city, common stopover en route to Nyungwe.',
    color: '#ea580c',
  },
  {
    id: 'rusizi',
    name: 'Rusizi (Cyangugu)',
    coordinates: { lat: -2.4847, lng: 28.9075 },
    type: 'city' as const,
    description: 'Lake Kivu border town near Gisakura HQ — closest city to the park.',
    color: '#0284c7',
  },
  {
    id: 'musanze',
    name: 'Musanze (Ruhengeri)',
    coordinates: { lat: -1.4995, lng: 29.6336 },
    type: 'city' as const,
    description: 'Northern city, gateway to Volcanoes NP — connects via Kigali.',
    color: '#7c3aed',
  },
];

// Approximate driving routes (simplified polylines following main roads)
const ROUTES: Record<string, { from: string; to: string; coords: [number, number][]; distanceKm: number; durationHrs: number; via: string }[]> = {
  kigali: [
    {
      from: 'kigali',
      to: 'reception-uwinka',
      via: 'Kigali → Muhanga → Huye → Uwinka (RN1 + RN6)',
      distanceKm: 225,
      durationHrs: 5,
      coords: [
        [-1.9706, 30.1044],
        [-2.0850, 29.7560], // Muhanga
        [-2.5959, 29.7395], // Huye
        [-2.5300, 29.4500],
        [-2.4625, 29.198],  // Uwinka
      ],
    },
    {
      from: 'kigali',
      to: 'reception-gisakura',
      via: 'Kigali → Huye → Gisakura HQ',
      distanceKm: 270,
      durationHrs: 6,
      coords: [
        [-1.9706, 30.1044],
        [-2.0850, 29.7560],
        [-2.5959, 29.7395],
        [-2.5300, 29.4500],
        [-2.4625, 29.198],
        [-2.478, 29.105],
      ],
    },
  ],
  huye: [
    {
      from: 'huye',
      to: 'reception-uwinka',
      via: 'Huye → Uwinka (RN6 west)',
      distanceKm: 90,
      durationHrs: 2,
      coords: [
        [-2.5959, 29.7395],
        [-2.5300, 29.4500],
        [-2.4625, 29.198],
      ],
    },
  ],
  rusizi: [
    {
      from: 'rusizi',
      to: 'reception-gisakura',
      via: 'Rusizi → Gisakura HQ (RN6 east, 30 min)',
      distanceKm: 25,
      durationHrs: 0.5,
      coords: [
        [-2.4847, 28.9075],
        [-2.478, 29.105],
      ],
    },
  ],
  musanze: [
    {
      from: 'musanze',
      to: 'reception-uwinka',
      via: 'Musanze → Kigali → Huye → Uwinka',
      distanceKm: 320,
      durationHrs: 7,
      coords: [
        [-1.4995, 29.6336],
        [-1.9706, 30.1044],
        [-2.0850, 29.7560],
        [-2.5959, 29.7395],
        [-2.4625, 29.198],
      ],
    },
  ],
};

const RWANDA_CENTER: [number, number] = [-2.0, 29.7];
const RWANDA_BOUNDS: L.LatLngBoundsExpression = [[-2.95, 28.8], [-1.0, 30.95]];

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
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    // Park reception markers
    RECEPTIONS.forEach((r) => {
      L.marker([r.coordinates.lat, r.coordinates.lng], { icon: parkIcon })
        .bindPopup(`<strong>${r.name}</strong><br/><span style="font-size:12px;">Park entrance</span>`)
        .addTo(layer);
    });

    // Origin markers
    ORIGINS.forEach((o) => {
      const icon = createOriginIcon(o.color, o.type === 'airport', o.id === activeOrigin);
      L.marker([o.coordinates.lat, o.coordinates.lng], { icon })
        .bindPopup(`<strong>${o.name}</strong><br/><span style="font-size:12px;">${o.description}</span>`)
        .addTo(layer);
    });

    // Routes from active origin
    const routes = ROUTES[activeOrigin] || [];
    const allCoords: [number, number][] = [];
    routes.forEach((route, idx) => {
      L.polyline(route.coords, {
        color: idx === 0 ? '#16a34a' : '#2563eb',
        weight: 5,
        opacity: 0.8,
        dashArray: idx === 0 ? undefined : '10 6',
      })
        .bindPopup(`<div style="font-size:12px;"><strong>${route.via}</strong><br/>${route.distanceKm} km · ~${route.durationHrs}h drive</div>`)
        .addTo(layer);
      allCoords.push(...route.coords);
    });

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [activeOrigin]);

  const activeRoutes = ROUTES[activeOrigin] || [];
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
          >
            {o.type === 'airport' ? <Plane className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            From {o.name.split(' (')[0]}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative h-[480px] w-full overflow-hidden rounded-lg border border-border bg-muted">
          <div ref={containerRef} className="h-full w-full" />
        </div>

        <Card className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              From {active?.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{active?.description}</p>
          </div>

          <div className="space-y-3">
            {activeRoutes.map((route, idx) => {
              const dest = RECEPTIONS.find((r) => r.id === route.to);
              return (
                <div key={idx} className="border border-border rounded-lg p-3 bg-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-medium text-sm">→ {dest?.name}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{route.via}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-foreground">
                      <Car className="w-3 h-3" /> {route.distanceKm} km
                    </span>
                    <span className="flex items-center gap-1 text-foreground">
                      <Clock className="w-3 h-3" /> ~{route.durationHrs}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Most tourists fly into Kigali (KGL) and drive 5–6 hours via Huye. Domestic flights to Kamembe (Rusizi) cut travel to ~1 hour total.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
