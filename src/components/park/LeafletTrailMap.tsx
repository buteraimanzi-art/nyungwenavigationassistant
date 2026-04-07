import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Trail, UserLocation, Attraction, RestArea } from '@/lib/types';
import { TRAIL_GPS_PATHS } from '@/lib/trail-gps-paths';
import { RECEPTIONS, getReceptionForTrail } from '@/lib/receptions';
import { calculateDistance } from '@/lib/trail-data';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const receptionIcon = new L.DivIcon({
  html: `<div style="background:#16a34a;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">R</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const activeReceptionIcon = new L.DivIcon({
  html: `<div style="background:#ea580c;color:white;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;border:3px solid white;box-shadow:0 2px 12px rgba(234,88,12,0.5);animation:pulse 1.5s infinite;">R</div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const userIcon = new L.DivIcon({
  html: `<div style="background:#3b82f6;border-radius:50%;width:16px;height:16px;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.3);"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Nyungwe park center & bounds
const PARK_CENTER: [number, number] = [-2.45, 29.25];
const RWANDA_BOUNDS: L.LatLngBoundsExpression = [[-2.85, 28.85], [-1.05, 30.90]];

interface LeafletTrailMapProps {
  trail: Trail;
  userLocation: UserLocation | null;
  showDirections?: boolean;
  onSelectAttraction?: (a: Attraction) => void;
  onSelectRestArea?: (r: RestArea) => void;
}

function FlyToUser({ location }: { location: UserLocation | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      const dist = calculateDistance(
        { lat: map.getCenter().lat, lng: map.getCenter().lng },
        { lat: location.lat, lng: location.lng }
      );
      // Only fly if user is far from current center
      if (dist > 5000) {
        map.flyTo([location.lat, location.lng], 14, { duration: 1.5 });
      }
    }
  }, []);
  return null;
}

export function LeafletTrailMap({ trail, userLocation, showDirections }: LeafletTrailMapProps) {
  const trailPaths = useMemo(() => TRAIL_GPS_PATHS.filter(p => p.category === 'trail'), []);
  const roadPaths = useMemo(() => TRAIL_GPS_PATHS.filter(p => p.category === 'road'), []);

  const activeReception = useMemo(
    () => showDirections ? getReceptionForTrail(trail.id) : null,
    [showDirections, trail]
  );

  const directionLine = useMemo(() => {
    if (!activeReception) return null;
    const from: [number, number] = [activeReception.coordinates.lat, activeReception.coordinates.lng];
    const to: [number, number] = [trail.startPoint.lat, trail.startPoint.lng];
    return [from, to];
  }, [activeReception, trail]);

  return (
    <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-lg border border-border">
      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        .leaflet-container { height: 100%; width: 100%; background: hsl(var(--muted)); }
      `}</style>
      <MapContainer
        center={PARK_CENTER}
        zoom={12}
        minZoom={8}
        maxZoom={18}
        maxBounds={RWANDA_BOUNDS}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Road overlays */}
        {roadPaths.map(path => (
          <Polyline
            key={path.id}
            positions={path.coords as [number, number][]}
            pathOptions={{ color: '#dc2626', weight: 3, opacity: 0.6, dashArray: '8 4' }}
          />
        ))}

        {/* Trail overlays */}
        {trailPaths.map(path => (
          <Polyline
            key={path.id}
            positions={path.coords as [number, number][]}
            pathOptions={{ color: '#16a34a', weight: 4, opacity: 0.8 }}
          />
        ))}

        {/* Direction path from reception to trail */}
        {directionLine && (
          <Polyline
            positions={directionLine}
            pathOptions={{ color: '#ea580c', weight: 4, opacity: 0.8, dashArray: '12 8' }}
          />
        )}

        {/* Reception markers */}
        {RECEPTIONS.map(r => (
          <Marker
            key={r.id}
            position={[r.coordinates.lat, r.coordinates.lng]}
            icon={activeReception?.id === r.id ? activeReceptionIcon : receptionIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>{r.name}</strong>
                <p className="text-xs mt-1 text-muted-foreground">{r.description}</p>
                {r.phone && <p className="text-xs mt-1">📞 {r.phone}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Trail start marker */}
        <Marker position={[trail.startPoint.lat, trail.startPoint.lng]}>
          <Popup>
            <strong>{trail.name}</strong>
            <br />
            <span className="text-xs">Trail start point</span>
          </Popup>
        </Marker>

        {/* User location */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            >
              <Popup>
                <strong>Your Location</strong>
                <br />
                <span className="text-xs font-mono">
                  {userLocation.lat.toFixed(4)}°S, {userLocation.lng.toFixed(4)}°E
                </span>
                {userLocation.speed && userLocation.speed > 0.3 && (
                  <><br /><span className="text-xs">{(userLocation.speed * 3.6).toFixed(1)} km/h</span></>
                )}
              </Popup>
            </Marker>
            <FlyToUser location={userLocation} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
