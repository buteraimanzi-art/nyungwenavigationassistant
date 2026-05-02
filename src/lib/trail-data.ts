import type { Trail, Attraction, RestArea } from './types';
import { NYUNGWE_FOREST_BOUNDS } from './trail-loops';
import { clampToNyungwePolygon, pointInNyungwe, NYUNGWE_CENTROID } from './nyungwe-boundary';

export const MAP_BOUNDS = {
  north: -2.35,
  south: -2.55,
  west: 29.05,
  east: 29.45,
  imageWidth: 952,
  imageHeight: 936,
};

export function coordsToPercent(lat: number, lng: number) {
  const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100;
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100;
  return { x, y };
}

interface OfficialTrailSeed {
  id: string;
  name: string;
  distanceKm: number;
  description: string;
  anchor: { lat: number; lng: number };
  difficulty?: Trail['difficulty'];
  durationMin?: number;
  elevationGain?: number;
}

/** Pull anchors strictly inside the polygon (not just the bbox). */
function clampAnchor(a: { lat: number; lng: number }) {
  return clampToNyungwePolygon(a, 0.012);
}

/** Maximum loop radius (deg) that fits inside the polygon from this anchor. */
function maxRadiusForAnchor(a: { lat: number; lng: number }): number {
  if (!pointInNyungwe(a)) return 0.003;
  let minR = 0.05;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    let lo = 0, hi = 0.08;
    while (hi - lo > 0.0005) {
      const mid = (lo + hi) / 2;
      const test = { lat: a.lat + Math.sin(angle) * mid, lng: a.lng + Math.cos(angle) * mid };
      if (pointInNyungwe(test)) lo = mid;
      else hi = mid;
    }
    if (lo < minR) minR = lo;
  }
  return Math.max(0.001, minR * 0.85);
}

/**
 * Sample N evenly-spaced points along a trail-like organic loop around `anchor`.
 * Loop radius is clamped so positions stay inside the forest, matching what
 * `generateTrailLoop` produces.
 */
function sampleLoopPositions(seed: OfficialTrailSeed, count: number, phase: number): { lat: number; lng: number }[] {
  const anchor = clampAnchor(seed.anchor);
  const desired = seed.distanceKm / (2 * Math.PI * 111);
  const radiusDeg = Math.min(Math.max(0.0015, desired), maxRadiusForAnchor(anchor));
  const seedNum = seed.id.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const rand = (i: number) => {
    const x = Math.sin(seedNum * 0.013 + i * 1.7) * 10000;
    return x - Math.floor(x);
  };
  const out: { lat: number; lng: number }[] = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const angle = 2 * Math.PI * t + phase;
    const noise = (rand(i * 7) - 0.5) * 0.25;
    const r = radiusDeg * (1 + noise);
    const candidate = {
      lat: anchor.lat + Math.sin(angle) * r * 0.85,
      lng: anchor.lng + Math.cos(angle) * r,
    };
    out.push(clampToNyungwePolygon(candidate, 0.005));
  }
  return out;
}

function generateRestAreas(seed: OfficialTrailSeed): RestArea[] {
  const numRests = Math.max(2, Math.min(5, Math.round(seed.distanceKm / 2.5)));
  const positions = sampleLoopPositions(seed, numRests, 0);
  const types: RestArea['type'][] = ['bench', 'shelter', 'picnic', 'toilet'];
  const amenitySets = [
    ['Bench', 'Shade'],
    ['Shelter', 'Bench', 'Water'],
    ['Picnic table', 'Bench', 'Shade', 'Waste bin'],
    ['Toilet', 'Water', 'Bench'],
  ];
  const restNames = ['Forest Bench', 'Canopy Shelter', 'Picnic Clearing', 'Trailside Stop', 'Quiet Glade'];

  return positions.map((coord, i) => {
    const seed2 = Math.sin(seed.id.charCodeAt(0) * (i + 1) * 13.7) * 0.5 + 0.5;
    const typeIdx = Math.floor(seed2 * types.length) % types.length;
    return {
      id: `${seed.id}-rest-${i}`,
      name: `${restNames[i % restNames.length]} ${i + 1}`,
      type: types[typeIdx],
      coordinates: coord,
      amenities: amenitySets[typeIdx],
      capacity: 4 + Math.floor(seed2 * 12),
    };
  });
}

function generateAttractions(seed: OfficialTrailSeed): Attraction[] {
  const numAtt = Math.max(2, Math.min(4, Math.round(seed.distanceKm / 3)));
  // phase-shifted so attractions sit between rest stops on the loop
  const positions = sampleLoopPositions(seed, numAtt, Math.PI / numAtt);
  const types: Attraction['type'][] = ['viewpoint', 'waterfall', 'wildlife', 'flora'];
  const typeNames: Record<Attraction['type'], string[]> = {
    viewpoint: ['Mountain Viewpoint', 'Canopy Overlook', 'Valley Vista'],
    waterfall: ['Hidden Falls', 'Cascade Pool', 'Misty Falls'],
    wildlife: ['Monkey Crossing', 'Bird Watch Point', 'Colobus Territory'],
    flora: ['Orchid Garden', 'Ancient Tree', 'Bamboo Grove'],
    historical: ['Heritage Site'],
    campsite: ['Forest Camp'],
  };

  return positions.map((coord, i) => {
    const seed2 = Math.cos(seed.id.charCodeAt(1) * (i + 1) * 7.3) * 0.5 + 0.5;
    const typeIdx = Math.floor(seed2 * types.length) % types.length;
    const names = typeNames[types[typeIdx]];
    return {
      id: `${seed.id}-att-${i}`,
      name: names[i % names.length],
      type: types[typeIdx],
      description: `A beautiful ${types[typeIdx]} along the ${seed.name} trail.`,
      coordinates: coord,
      distanceFromTrail: Math.round(10 + seed2 * 40),
    };
  });
}

function createStaticTrail(seed: OfficialTrailSeed): Trail {
  const totalDistance = Math.round(seed.distanceKm * 1000);
  const elevation = seed.elevationGain || Math.round(seed.distanceKm * 35);
  const duration = seed.durationMin || Math.round(seed.distanceKm * 18);
  const anchor = clampAnchor(seed.anchor);
  const seedWithAnchor = { ...seed, anchor };
  const point = {
    lat: anchor.lat,
    lng: anchor.lng,
    elevation: 1900 + Math.sin(seed.id.length * 3.7) * 300,
    distanceFromStart: 0,
  };

  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    difficulty: seed.difficulty || (seed.distanceKm > 15 ? 'difficult' : seed.distanceKm > 6 ? 'moderate' : 'easy'),
    totalDistance,
    estimatedDuration: duration,
    elevationGain: elevation,
    startPoint: anchor,
    endPoint: anchor,
    path: [point],
    attractions: generateAttractions(seedWithAnchor),
    restAreas: generateRestAreas(seedWithAnchor),
  };
}

export const trails: Trail[] = [
  createStaticTrail({
    id: 'trail-igishigishigi',
    name: 'Igishigishigi',
    distanceKm: 2.1,
    description: 'Official Nyungwe trail from your uploaded map, marked there as the shortest 2.1 km route.',
    anchor: { lat: -2.474, lng: 29.199 },
  }),
  createStaticTrail({
    id: 'trail-buhoro',
    name: 'Buhoro',
    distanceKm: 1.8,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.472, lng: 29.194 },
  }),
  createStaticTrail({
    id: 'trail-umuyove',
    name: 'Umuyove',
    distanceKm: 5.5,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.47, lng: 29.189 },
  }),
  createStaticTrail({
    id: 'trail-imbaraga',
    name: 'Imbaraga',
    distanceKm: 9.8,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.468, lng: 29.185 },
  }),
  createStaticTrail({
    id: 'trail-irebero',
    name: 'Irebero',
    distanceKm: 3.6,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.466, lng: 29.181 },
  }),
  createStaticTrail({
    id: 'trail-umugote',
    name: 'Umugote',
    distanceKm: 3.6,
    description: 'Official Nyungwe trail from your uploaded map, marked there as the shortest 3.6 km route.',
    anchor: { lat: -2.464, lng: 29.176 },
  }),
  createStaticTrail({
    id: 'trail-rukuzi',
    name: 'Rukuzi',
    distanceKm: 9.1,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.461, lng: 29.17 },
  }),
  createStaticTrail({
    id: 'trail-bigugu',
    name: 'Bigugu',
    distanceKm: 13.2,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.427, lng: 29.247 },
  }),
  createStaticTrail({
    id: 'trail-uwinka',
    name: 'Uwinka',
    distanceKm: 18,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.475, lng: 29.2 },
  }),
  createStaticTrail({
    id: 'trail-kamiranzovu',
    name: 'Kamiranzovu',
    distanceKm: 3.92,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.46, lng: 29.166 },
  }),
  createStaticTrail({
    id: 'trail-karamba',
    name: 'Karamba',
    distanceKm: 4,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.469, lng: 29.147 },
  }),
  createStaticTrail({
    id: 'trail-ndambarare',
    name: 'Ndambarare',
    distanceKm: 7.5,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.448, lng: 29.121 },
  }),
  createStaticTrail({
    id: 'trail-kamiranzovu-waterfall',
    name: 'Kamiranzovu Waterfall',
    distanceKm: 6.5,
    description: 'Official Nyungwe trail from your uploaded map, marked there as the shortest 6.5 km waterfall route.',
    anchor: { lat: -2.453, lng: 29.161 },
  }),
  createStaticTrail({
    id: 'trail-muzimu',
    name: 'Muzimu',
    distanceKm: 11,
    description: 'Official Nyungwe trail from your uploaded map, marked there as the shortest 11 km route.',
    anchor: { lat: -2.384, lng: 29.348 },
  }),
  createStaticTrail({
    id: 'trail-cyinzobe',
    name: 'Cyinzobe',
    distanceKm: 23,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.412, lng: 29.305 },
  }),
  createStaticTrail({
    id: 'trail-congo-nile',
    name: 'Congo–Nile',
    distanceKm: 109,
    description: 'Official Nyungwe route from your uploaded map, listed as 109 km plus 12 km between the Nile sources.',
    anchor: { lat: -2.405, lng: 29.296 },
  }),
  createStaticTrail({
    id: 'trail-uwasenkoko-mubuga',
    name: 'Uwasenkoko–Mubuga',
    distanceKm: 14,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.497, lng: 29.342 },
  }),
  createStaticTrail({
    id: 'trail-nshili-uwasenkoko',
    name: 'Nshili–Uwasenkoko',
    distanceKm: 41,
    description: 'Official Nyungwe trail from your uploaded map.',
    anchor: { lat: -2.542, lng: 29.405 },
  }),
];

export function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((point1.lat * Math.PI) / 180) * Math.cos((point2.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestPointOnTrail(userLocation: { lat: number; lng: number }, trail: Trail) {
  if (trail.path.length === 0) {
    return {
      point: { lat: userLocation.lat, lng: userLocation.lng, elevation: 0, distanceFromStart: 0 },
      index: 0,
      distance: 0,
    };
  }

  let nearestPoint = trail.path[0];
  let nearestIndex = 0;
  let minDistance = calculateDistance(userLocation, trail.path[0]);

  trail.path.forEach((point, index) => {
    const distance = calculateDistance(userLocation, point);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
      nearestIndex = index;
    }
  });

  return { point: nearestPoint, index: nearestIndex, distance: minDistance };
}

export function calculateTrailProgress(userLocation: { lat: number; lng: number }, trail: Trail) {
  const { point } = findNearestPointOnTrail(userLocation, trail);
  const distanceCovered = point.distanceFromStart;
  const distanceRemaining = Math.max(trail.totalDistance - distanceCovered, 0);
  const estimatedTimeRemaining = 0;
  let nearestRestArea: RestArea | null = null;
  let distanceToNearestRestArea = Infinity;

  trail.restAreas.forEach((ra) => {
    const dist = calculateDistance(userLocation, ra.coordinates);
    if (dist < distanceToNearestRestArea) {
      distanceToNearestRestArea = dist;
      nearestRestArea = ra;
    }
  });

  const nearbyAttractions = trail.attractions
    .map((a: Attraction) => ({ ...a, distance: calculateDistance(userLocation, a.coordinates) }))
    .filter((a) => a.distance < 500)
    .sort((a, b) => a.distance - b.distance);

  return {
    distanceCovered,
    distanceRemaining,
    estimatedTimeRemaining,
    currentElevation: point.elevation,
    nearestRestArea,
    distanceToNearestRestArea: Number.isFinite(distanceToNearestRestArea) ? Math.round(distanceToNearestRestArea) : 0,
    nearbyAttractions,
    percentComplete: trail.totalDistance > 0 ? Math.round((distanceCovered / trail.totalDistance) * 100) : 0,
  };
}
