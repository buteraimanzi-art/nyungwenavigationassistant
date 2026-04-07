import type { Coordinates } from './types';
import { calculateDistance } from './trail-data';
import { gpsToViewbox } from './official-trail-overlays';

export interface Reception {
  id: string;
  name: string;
  coordinates: Coordinates;
  description: string;
  phone?: string;
}

// The 3 official reception/gate points on the Nyungwe map
export const RECEPTIONS: Reception[] = [
  {
    id: 'reception-gisakura',
    name: 'Gisakura Reception',
    coordinates: { lat: -2.478, lng: 29.105 },
    description: 'Western entrance. Check-in point for Igishigishigi, Buhoro, Umuyove, Imbaraga, Irebero, Umugote, and Rukuzi trails.',
    phone: '+250 788 000 001',
  },
  {
    id: 'reception-uwinka',
    name: 'Uwinka Reception',
    coordinates: { lat: -2.468, lng: 29.198 },
    description: 'Central entrance. Check-in point for Uwinka, Kamiranzovu, Karamba, Kamiranzovu Waterfall, Ndambarare, and Bigugu trails.',
    phone: '+250 788 000 002',
  },
  {
    id: 'reception-gisovu',
    name: 'Gisovu Reception',
    coordinates: { lat: -2.382, lng: 29.340 },
    description: 'Northeast entrance near Source of the Nile. Check-in for Muzimu, Cyinzobe, Congo–Nile, Uwasenkoko–Mubuga, and Nshili–Uwasenkoko trails.',
    phone: '+250 788 000 003',
  },
];

// Map trail IDs to their nearest reception
const TRAIL_RECEPTION_MAP: Record<string, string> = {
  'trail-igishigishigi': 'reception-gisakura',
  'trail-buhoro': 'reception-gisakura',
  'trail-umuyove': 'reception-gisakura',
  'trail-imbaraga': 'reception-gisakura',
  'trail-irebero': 'reception-gisakura',
  'trail-umugote': 'reception-gisakura',
  'trail-rukuzi': 'reception-gisakura',
  'trail-uwinka': 'reception-uwinka',
  'trail-kamiranzovu': 'reception-uwinka',
  'trail-karamba': 'reception-uwinka',
  'trail-kamiranzovu-waterfall': 'reception-uwinka',
  'trail-ndambarare': 'reception-uwinka',
  'trail-bigugu': 'reception-uwinka',
  'trail-muzimu': 'reception-gisovu',
  'trail-cyinzobe': 'reception-gisovu',
  'trail-congo-nile': 'reception-gisovu',
  'trail-uwasenkoko-mubuga': 'reception-gisovu',
  'trail-nshili-uwasenkoko': 'reception-gisovu',
};

export function getReceptionForTrail(trailId: string): Reception {
  const receptionId = TRAIL_RECEPTION_MAP[trailId];
  return RECEPTIONS.find(r => r.id === receptionId) || RECEPTIONS[0];
}

export function getNearestReception(location: Coordinates): Reception {
  let nearest = RECEPTIONS[0];
  let minDist = Infinity;
  for (const r of RECEPTIONS) {
    const d = calculateDistance(location, r.coordinates);
    if (d < minDist) { minDist = d; nearest = r; }
  }
  return nearest;
}

export function getDistanceToReception(location: Coordinates, reception: Reception): number {
  return calculateDistance(location, reception.coordinates);
}

// Check if user is within ~5km of any reception (i.e. "in the park area")
export function isNearPark(location: Coordinates): boolean {
  return RECEPTIONS.some(r => calculateDistance(location, r.coordinates) < 15000);
}

// Get the viewbox position for a reception on the map
export function getReceptionViewboxPos(reception: Reception) {
  return gpsToViewbox(reception.coordinates.lat, reception.coordinates.lng);
}

// Generate an SVG path string from reception to trail anchor (straight line on map)
export function getDirectionPath(reception: Reception, trailAnchor: Coordinates): string {
  const from = gpsToViewbox(reception.coordinates.lat, reception.coordinates.lng);
  const to = gpsToViewbox(trailAnchor.lat, trailAnchor.lng);
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}
