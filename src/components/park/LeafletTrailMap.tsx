import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Trail, UserLocation, Attraction, RestArea } from '@/lib/types';
import { TRAIL_GPS_PATHS } from '@/lib/trail-gps-paths';
import { RECEPTIONS, type Reception } from '@/lib/receptions';
import type { NavStep } from '@/lib/navigation';
import { MapLayerToggle, type MapLayer } from './MapLayerToggle';
import { generateTrailLoop, getTrailColor } from '@/lib/trail-loops';
import { NYUNGWE_POLYGON_LATLNG } from '@/lib/nyungwe-boundary';

const PARK_CENTER: [number, number] = [-2.45, 29.25];
const PARK_ZOOM = 12;
const RWANDA_BOUNDS: L.LatLngBoundsExpression = [[-2.85, 28.85], [-1.05, 30.9]];

const TILE_URLS: Record<MapLayer, { url: string; attr: string }> = {
  street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OpenStreetMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '&copy; Esri' },
  terrain: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '&copy; OpenTopoMap' },
};

interface LeafletTrailMapProps {
  trail: Trail;
  userLocation: UserLocation | null;
  showDirections?: boolean;
  chosenReception?: Reception | null;
  navSteps?: NavStep[] | null;
  /** Real road-following geometry from OSRM. When provided, drawn as the route polyline. */
  routeGeometry?: { lat: number; lng: number }[] | null;
  onSelectAttraction?: (a: Attraction) => void;
  onSelectRestArea?: (r: RestArea) => void;
  /** Change this value (e.g. trail.id, sheet-open boolean) to force the map to recompute its size. */
  resizeTrigger?: string | number | boolean;
}

function createDivIcon(label: string, background: string, size = 32) {
  return L.divIcon({
    html: `<div style="background:${background};color:white;border-radius:9999px;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size * 0.42)}px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.28);">${label}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const receptionIcon = createDivIcon('R', '#16a34a', 32);
const hqIcon = createDivIcon('HQ', '#b91c1c', 38);
const activeReceptionIcon = createDivIcon('R', '#ea580c', 38);
const activeHqIcon = createDivIcon('HQ', '#ea580c', 42);
const trailStartIcon = createDivIcon('T', '#0f766e', 30);
const userIcon = createDivIcon('•', '#2563eb', 20);
const restIcon = createDivIcon('🪑', '#0284c7', 24);

function createStepIcon(num: number, isActive: boolean) {
  const bg = isActive ? '#2563eb' : '#6b7280';
  const size = isActive ? 26 : 20;
  return L.divIcon({
    html: `<div style="background:${bg};color:white;border-radius:9999px;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size * 0.45)}px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);">${num}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function LeafletTrailMap({ trail, userLocation, showDirections, chosenReception, navSteps, routeGeometry }: LeafletTrailMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayer>('street');

  const trailPaths = useMemo(() => TRAIL_GPS_PATHS.filter((p) => p.category === 'trail'), []);
  const roadPaths = useMemo(() => TRAIL_GPS_PATHS.filter((p) => p.category === 'road'), []);
  const activeReception = showDirections && chosenReception ? chosenReception : null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: PARK_CENTER, zoom: PARK_ZOOM, minZoom: 8, maxZoom: 18,
      maxBounds: RWANDA_BOUNDS, zoomControl: true,
    });
    const tile = TILE_URLS[mapLayer];
    tileLayerRef.current = L.tileLayer(tile.url, { attribution: tile.attr }).addTo(map);
    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Force recalculation when the container size becomes available (mobile flex)
    const invalidate = () => map.invalidateSize();
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 400);
    const t3 = setTimeout(invalidate, 1000);
    const ro = new ResizeObserver(invalidate);
    ro.observe(containerRef.current);
    window.addEventListener('resize', invalidate);
    window.addEventListener('orientationchange', invalidate);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      ro.disconnect();
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('orientationchange', invalidate);
      map.remove();
      mapRef.current = null; layerGroupRef.current = null; tileLayerRef.current = null;
    };
  }, []);

  // Switch tile layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const tile = TILE_URLS[mapLayer];
    tileLayerRef.current = L.tileLayer(tile.url, { attribution: tile.attr }).addTo(map);
  }, [mapLayer]);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;
    layerGroup.clearLayers();

    // Nyungwe forest boundary — realistic polygon outline so users see trails stay inside
    L.polygon(NYUNGWE_POLYGON_LATLNG, {
      color: '#15803d',
      weight: 2.5,
      opacity: 0.7,
      fillColor: '#22c55e',
      fillOpacity: 0.07,
      dashArray: '6 6',
      smoothFactor: 1,
    })
      .addTo(layerGroup)
      .bindPopup('<strong>Nyungwe National Park</strong><br/><span style="font-size:11px;">Forest boundary (approx.)</span>');

    roadPaths.forEach((path) => {
      L.polyline(path.coords, { color: '#dc2626', weight: 3, opacity: 0.6, dashArray: '8 4' }).addTo(layerGroup);
    });
    trailPaths.forEach((path) => {
      L.polyline(path.coords, { color: '#16a34a', weight: 4, opacity: 0.8 }).addTo(layerGroup);
    });

    // Receptions
    RECEPTIONS.forEach((reception) => {
      const isHQ = reception.id === 'reception-gisakura';
      const isActive = activeReception?.id === reception.id;
      let icon;
      if (isActive) icon = isHQ ? activeHqIcon : activeReceptionIcon;
      else icon = isHQ ? hqIcon : receptionIcon;
      L.marker([reception.coordinates.lat, reception.coordinates.lng], { icon })
        .bindPopup(`<div style="font-size:12px;line-height:1.4;min-width:180px;"><strong>${reception.name}</strong><br/><span>${reception.description}</span>${reception.phone ? `<br/>📞 ${reception.phone}` : ''}</div>`)
        .addTo(layerGroup);
    });

    // Per-trail unique color loop (round-trip, non-backtracking organic path)
    const trailColor = getTrailColor(trail.id);
    const loop = generateTrailLoop(trail);
    const loopCoords: [number, number][] = loop.map((p) => [p.lat, p.lng]);
    // Outbound half — solid
    const half = Math.ceil(loopCoords.length / 2);
    L.polyline(loopCoords.slice(0, half + 1), {
      color: trailColor, weight: 5, opacity: 0.9,
    }).addTo(layerGroup).bindPopup(`<strong>${trail.name}</strong><br/><span style="font-size:11px;">Outbound</span>`);
    // Return half — same color, dashed so direction is clear
    L.polyline(loopCoords.slice(half), {
      color: trailColor, weight: 5, opacity: 0.9, dashArray: '10 6',
    }).addTo(layerGroup).bindPopup(`<strong>${trail.name}</strong><br/><span style="font-size:11px;">Return path</span>`);

    // Trail start
    L.marker([trail.startPoint.lat, trail.startPoint.lng], { icon: trailStartIcon })
      .bindPopup(`<strong>${trail.name}</strong><br/><span style="font-size:12px;">Trail start &amp; end (loop)</span>`)
      .addTo(layerGroup);

    // Rest areas on trail
    trail.restAreas.forEach((ra) => {
      L.marker([ra.coordinates.lat, ra.coordinates.lng], { icon: restIcon })
        .bindPopup(`<div style="font-size:12px;"><strong>${ra.name}</strong><br/>${ra.amenities.join(', ')}</div>`)
        .addTo(layerGroup);
    });

    // Navigation route
    if (navSteps && navSteps.length > 0 && activeReception) {
      // Prefer real road geometry from OSRM when provided
      const polylineCoords: [number, number][] =
        routeGeometry && routeGeometry.length > 1
          ? routeGeometry.map((p) => [p.lat, p.lng])
          : navSteps.map((s) => [s.coordinate.lat, s.coordinate.lng]);
      L.polyline(polylineCoords, { color: '#2563eb', weight: 6, opacity: 0.85 }).addTo(layerGroup);

      const currentIdx = userLocation ? findNearestStepIdx(userLocation, navSteps) : 0;
      navSteps.forEach((step, i) => {
        if (i === 0 || i === navSteps.length - 1) return;
        const icon = createStepIcon(i, i === currentIdx);
        L.marker([step.coordinate.lat, step.coordinate.lng], { icon })
          .bindPopup(`<div style="font-size:12px;"><strong>Step ${i + 1}</strong><br/>${step.instruction}</div>`)
          .addTo(layerGroup);
      });
      const bounds = L.latLngBounds(polylineCoords);
      if (userLocation && isFinite(userLocation.lat)) bounds.extend([userLocation.lat, userLocation.lng]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (activeReception) {
      L.polyline(
        [[activeReception.coordinates.lat, activeReception.coordinates.lng], [trail.startPoint.lat, trail.startPoint.lng]],
        { color: '#ea580c', weight: 4, opacity: 0.85, dashArray: '12 8' }
      ).addTo(layerGroup);
      if (userLocation && isFinite(userLocation.lat)) {
        L.polyline([[userLocation.lat, userLocation.lng], [activeReception.coordinates.lat, activeReception.coordinates.lng]], { color: '#2563eb', weight: 3, opacity: 0.7, dashArray: '6 6' }).addTo(layerGroup);
      }
      const bounds = L.latLngBounds([[activeReception.coordinates.lat, activeReception.coordinates.lng], [trail.startPoint.lat, trail.startPoint.lng]]);
      if (userLocation && isFinite(userLocation.lat)) bounds.extend([userLocation.lat, userLocation.lng]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    // User location
    if (userLocation && isFinite(userLocation.lat) && isFinite(userLocation.lng)) {
      L.circle([userLocation.lat, userLocation.lng], { radius: userLocation.accuracy, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.12, weight: 1 }).addTo(layerGroup);
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindPopup(`<div style="font-size:12px;"><strong>Your Location</strong><br/>${userLocation.lat.toFixed(4)}°S, ${userLocation.lng.toFixed(4)}°E${userLocation.speed && userLocation.speed > 0.3 ? `<br/>${(userLocation.speed * 3.6).toFixed(1)} km/h` : ''}</div>`)
        .addTo(layerGroup);
      if (!activeReception && !navSteps) map.setView([userLocation.lat, userLocation.lng], 13);
    } else if (!activeReception) {
      map.setView(PARK_CENTER, PARK_ZOOM);
    }
  }, [activeReception, navSteps, routeGeometry, roadPaths, trail, trailPaths, userLocation]);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-muted md:relative md:rounded-lg md:border md:border-border">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <MapLayerToggle currentLayer={mapLayer} onChange={setMapLayer} />
    </div>
  );
}

function findNearestStepIdx(loc: { lat: number; lng: number }, steps: NavStep[]): number {
  let minD = Infinity; let idx = 0;
  for (let i = 0; i < steps.length; i++) {
    const dlat = loc.lat - steps[i].coordinate.lat;
    const dlng = loc.lng - steps[i].coordinate.lng;
    const d = dlat * dlat + dlng * dlng;
    if (d < minD) { minD = d; idx = i; }
  }
  return idx;
}
