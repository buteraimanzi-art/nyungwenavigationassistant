import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Trail, UserLocation, Attraction, RestArea } from '@/lib/types';
import { TRAIL_GPS_PATHS } from '@/lib/trail-gps-paths';
import { RECEPTIONS, type Reception } from '@/lib/receptions';

const PARK_CENTER: [number, number] = [-2.45, 29.25];
const PARK_ZOOM = 12;
const RWANDA_BOUNDS: L.LatLngBoundsExpression = [[-2.85, 28.85], [-1.05, 30.9]];

interface LeafletTrailMapProps {
  trail: Trail;
  userLocation: UserLocation | null;
  showDirections?: boolean;
  chosenReception?: Reception | null;
  onSelectAttraction?: (a: Attraction) => void;
  onSelectRestArea?: (r: RestArea) => void;
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

export function LeafletTrailMap({ trail, userLocation, showDirections, chosenReception }: LeafletTrailMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const trailPaths = useMemo(() => TRAIL_GPS_PATHS.filter((p) => p.category === 'trail'), []);
  const roadPaths = useMemo(() => TRAIL_GPS_PATHS.filter((p) => p.category === 'road'), []);
  const activeReception = showDirections && chosenReception ? chosenReception : null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: PARK_CENTER,
      zoom: PARK_ZOOM,
      minZoom: 8,
      maxZoom: 18,
      maxBounds: RWANDA_BOUNDS,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    roadPaths.forEach((path) => {
      L.polyline(path.coords, {
        color: '#dc2626',
        weight: 3,
        opacity: 0.6,
        dashArray: '8 4',
      }).addTo(layerGroup);
    });

    trailPaths.forEach((path) => {
      L.polyline(path.coords, {
        color: '#16a34a',
        weight: 4,
        opacity: 0.8,
      }).addTo(layerGroup);
    });

    RECEPTIONS.forEach((reception) => {
      const isHQ = reception.id === 'reception-gisakura';
      const isActive = activeReception?.id === reception.id;
      let icon;
      if (isActive) {
        icon = isHQ ? activeHqIcon : activeReceptionIcon;
      } else {
        icon = isHQ ? hqIcon : receptionIcon;
      }
      const marker = L.marker([reception.coordinates.lat, reception.coordinates.lng], { icon });
      marker.bindPopup(`
        <div style="font-size:12px;line-height:1.4;min-width:180px;">
          <strong>${reception.name}</strong><br/>
          <span>${reception.description}</span>
          ${reception.phone ? `<br/><span>📞 ${reception.phone}</span>` : ''}
        </div>
      `);
      marker.addTo(layerGroup);
    });

    L.marker([trail.startPoint.lat, trail.startPoint.lng], { icon: trailStartIcon })
      .bindPopup(`<strong>${trail.name}</strong><br/><span style="font-size:12px;">Trail start point</span>`)
      .addTo(layerGroup);

    // Direction overlays: user → reception → trail start
    if (activeReception) {
      // Line from reception to trail start (orange dashed)
      L.polyline(
        [
          [activeReception.coordinates.lat, activeReception.coordinates.lng],
          [trail.startPoint.lat, trail.startPoint.lng],
        ],
        { color: '#ea580c', weight: 4, opacity: 0.85, dashArray: '12 8' }
      ).addTo(layerGroup);

      // If user location exists, draw line from user to reception (blue dashed)
      if (userLocation && isFinite(userLocation.lat) && isFinite(userLocation.lng)) {
        L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            [activeReception.coordinates.lat, activeReception.coordinates.lng],
          ],
          { color: '#2563eb', weight: 3, opacity: 0.7, dashArray: '6 6' }
        ).addTo(layerGroup);
      }

      // Fit map to show the full route
      const bounds = L.latLngBounds([
        [activeReception.coordinates.lat, activeReception.coordinates.lng],
        [trail.startPoint.lat, trail.startPoint.lng],
      ]);
      if (userLocation && isFinite(userLocation.lat) && isFinite(userLocation.lng)) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    // User location marker
    if (userLocation && isFinite(userLocation.lat) && isFinite(userLocation.lng)) {
      L.circle([userLocation.lat, userLocation.lng], {
        radius: userLocation.accuracy,
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(layerGroup);

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindPopup(`
          <div style="font-size:12px;line-height:1.4;">
            <strong>Your Location</strong><br/>
            <span>${userLocation.lat.toFixed(4)}°S, ${userLocation.lng.toFixed(4)}°E</span>
            ${userLocation.speed && userLocation.speed > 0.3 ? `<br/><span>${(userLocation.speed * 3.6).toFixed(1)} km/h</span>` : ''}
          </div>
        `)
        .addTo(layerGroup);

      // Only auto-center on user when directions aren't active
      if (!activeReception) {
        map.setView([userLocation.lat, userLocation.lng], 13);
      }
    } else if (!activeReception) {
      map.setView(PARK_CENTER, PARK_ZOOM);
    }
  }, [activeReception, roadPaths, trail, trailPaths, userLocation]);

  return <div ref={containerRef} className="relative h-full min-h-[400px] w-full overflow-hidden rounded-lg border border-border bg-muted" />;
}
