import type { Trail, Attraction, RestArea } from './types';

export const MAP_BOUNDS = {
  north: -2.35,
  south: -2.55,
  west: 29.05,
  east: 29.45,
  imageWidth: 952,
  imageHeight: 936
};

export function coordsToPercent(lat: number, lng: number) {
  const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100;
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100;
  return { x, y };
}

export const attractions: Attraction[] = [
  { id: 'att-1', name: 'Canopy Walkway', type: 'viewpoint', description: "East Africa's only canopy walkway, suspended 50m above the forest floor with breathtaking views.", coordinates: { lat: -2.415, lng: 29.19 }, distanceFromTrail: 0 },
  { id: 'att-2', name: 'Kamiranzovu Swamp', type: 'flora', description: 'A unique montane swamp ecosystem home to orchids and rare bird species.', coordinates: { lat: -2.46, lng: 29.15 }, distanceFromTrail: 50 },
  { id: 'att-3', name: 'Uwinka Visitor Center', type: 'viewpoint', description: 'Main visitor center with information about the park and starting point for most trails.', coordinates: { lat: -2.475, lng: 29.20 }, distanceFromTrail: 0 },
  { id: 'att-4', name: 'Isumo Waterfall', type: 'waterfall', description: 'A beautiful cascade on the Isumo Trail, perfect for a refreshing break.', coordinates: { lat: -2.435, lng: 29.16 }, distanceFromTrail: 100 },
  { id: 'att-5', name: 'Congo-Nile Divide Viewpoint', type: 'viewpoint', description: 'Panoramic views where the Congo and Nile river basins meet at 2,500m elevation.', coordinates: { lat: -2.40, lng: 29.30 }, distanceFromTrail: 20 },
  { id: 'att-6', name: 'Colobus Monkey Spot', type: 'wildlife', description: 'Excellent viewing area for Rwenzori colobus monkeys, often seen in large troops.', coordinates: { lat: -2.43, lng: 29.25 }, distanceFromTrail: 30 },
  { id: 'att-7', name: 'Chimpanzee Territory', type: 'wildlife', description: 'Prime location for observing habituated chimpanzees in their natural habitat.', coordinates: { lat: -2.45, lng: 29.12 }, distanceFromTrail: 50 },
  { id: 'att-8', name: 'Muzimu Ancient Forest', type: 'flora', description: 'One of the oldest sections of the forest with ancient trees and rare orchids.', coordinates: { lat: -2.37, lng: 29.35 }, distanceFromTrail: 100 },
];

export const restAreas: RestArea[] = [
  { id: 'rest-1', name: 'Uwinka Visitor Center Shelter', type: 'shelter', coordinates: { lat: -2.475, lng: 29.20 }, amenities: ['Benches', 'Information Board', 'Water Point', 'First Aid', 'Toilets'], capacity: 30 },
  { id: 'rest-2', name: 'Canopy Walkway Rest Point', type: 'bench', coordinates: { lat: -2.42, lng: 29.195 }, amenities: ['Benches', 'Shade', 'Trail Marker'], capacity: 10 },
  { id: 'rest-3', name: 'Gisakura Forest Shelter', type: 'shelter', coordinates: { lat: -2.44, lng: 29.10 }, amenities: ['Shelter', 'Benches', 'Toilets', 'Water Point'], capacity: 15 },
  { id: 'rest-4', name: 'Kamiranzovu Picnic Area', type: 'picnic', coordinates: { lat: -2.465, lng: 29.17 }, amenities: ['Picnic Tables', 'Benches', 'Bins', 'Shade'], capacity: 20 },
  { id: 'rest-5', name: 'Congo-Nile Trail Bench', type: 'bench', coordinates: { lat: -2.41, lng: 29.28 }, amenities: ['Bench', 'Viewpoint', 'Trail Marker'], capacity: 6 },
  { id: 'rest-6', name: 'Banda Office Rest Stop', type: 'shelter', coordinates: { lat: -2.435, lng: 29.21 }, amenities: ['Shelter', 'Toilets', 'Information Board'], capacity: 12 },
  { id: 'rest-7', name: 'Karamba Trail Junction', type: 'bench', coordinates: { lat: -2.475, lng: 29.14 }, amenities: ['Bench', 'Direction Signs'], capacity: 8 },
  { id: 'rest-8', name: 'Ngabwe Trail Rest Area', type: 'bench', coordinates: { lat: -2.495, lng: 29.35 }, amenities: ['Bench', 'Shade'], capacity: 6 },
];

function generateTrailPath(
  waypoints: { lat: number; lng: number }[],
  baseElevation: number,
  elevationVariation: number
): { lat: number; lng: number; elevation: number; distanceFromStart: number }[] {
  const points: { lat: number; lng: number; elevation: number; distanceFromStart: number }[] = [];
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const segmentPoints = 15;
    for (let j = 0; j <= segmentPoints; j++) {
      if (i > 0 && j === 0) continue;
      const t = j / segmentPoints;
      const lat = start.lat + (end.lat - start.lat) * t;
      const lng = start.lng + (end.lng - start.lng) * t;
      if (points.length > 0) {
        const prevPoint = points[points.length - 1];
        const dLat = lat - prevPoint.lat;
        const dLng = lng - prevPoint.lng;
        totalDistance += Math.sqrt(dLat * dLat + dLng * dLng) * 111000;
      }
      const progress = (i + t) / (waypoints.length - 1);
      const elevation = baseElevation + Math.sin(progress * Math.PI * 2) * elevationVariation + Math.sin(progress * Math.PI * 4) * (elevationVariation / 3);
      points.push({ lat, lng, elevation: Math.round(elevation), distanceFromStart: Math.round(totalDistance) });
    }
  }
  return points;
}

export const trails: Trail[] = [
  {
    id: 'trail-canopy', name: 'Canopy Walkway Trail',
    description: "Experience the forest from above on East Africa's only canopy walkway, suspended 50 meters above the forest floor.",
    difficulty: 'moderate', totalDistance: 3500, estimatedDuration: 120, elevationGain: 280,
    startPoint: { lat: -2.475, lng: 29.20 }, endPoint: { lat: -2.415, lng: 29.19 },
    path: generateTrailPath([{ lat: -2.475, lng: 29.20 }, { lat: -2.46, lng: 29.195 }, { lat: -2.44, lng: 29.19 }, { lat: -2.425, lng: 29.192 }, { lat: -2.415, lng: 29.19 }], 2000, 150),
    attractions: [attractions[0], attractions[2]], restAreas: [restAreas[0], restAreas[1]]
  },
  {
    id: 'trail-isumo', name: 'Isumo Trail',
    description: 'A scenic hike through pristine rainforest to the beautiful Isumo waterfall.',
    difficulty: 'moderate', totalDistance: 5200, estimatedDuration: 180, elevationGain: 350,
    startPoint: { lat: -2.44, lng: 29.10 }, endPoint: { lat: -2.46, lng: 29.17 },
    path: generateTrailPath([{ lat: -2.44, lng: 29.10 }, { lat: -2.435, lng: 29.13 }, { lat: -2.44, lng: 29.15 }, { lat: -2.45, lng: 29.16 }, { lat: -2.46, lng: 29.17 }], 2100, 180),
    attractions: [attractions[3], attractions[6]], restAreas: [restAreas[2], restAreas[6]]
  },
  {
    id: 'trail-congo-nile', name: 'Congo-Nile Divide Trail',
    description: 'A challenging trail along the continental divide between the Congo and Nile river basins with stunning panoramic views.',
    difficulty: 'expert', totalDistance: 12000, estimatedDuration: 360, elevationGain: 650,
    startPoint: { lat: -2.435, lng: 29.21 }, endPoint: { lat: -2.37, lng: 29.35 },
    path: generateTrailPath([{ lat: -2.435, lng: 29.21 }, { lat: -2.425, lng: 29.24 }, { lat: -2.41, lng: 29.27 }, { lat: -2.40, lng: 29.30 }, { lat: -2.385, lng: 29.32 }, { lat: -2.37, lng: 29.35 }], 2300, 300),
    attractions: [attractions[4], attractions[5], attractions[7]], restAreas: [restAreas[5], restAreas[4]]
  },
  {
    id: 'trail-kamiranzovu', name: 'Kamiranzovu Trail',
    description: 'Explore the unique Kamiranzovu swamp ecosystem, home to orchids, elephants and rare bird species.',
    difficulty: 'moderate', totalDistance: 6500, estimatedDuration: 210, elevationGain: 320,
    startPoint: { lat: -2.475, lng: 29.20 }, endPoint: { lat: -2.475, lng: 29.14 },
    path: generateTrailPath([{ lat: -2.475, lng: 29.20 }, { lat: -2.47, lng: 29.18 }, { lat: -2.465, lng: 29.165 }, { lat: -2.46, lng: 29.15 }, { lat: -2.47, lng: 29.145 }, { lat: -2.475, lng: 29.14 }], 1950, 120),
    attractions: [attractions[1], attractions[2], attractions[6]], restAreas: [restAreas[0], restAreas[3], restAreas[6]]
  },
  {
    id: 'trail-ngabwe', name: 'Ngabwe Trail',
    description: 'A peaceful trail from Kitabi Office through the eastern section of the park with diverse wildlife.',
    difficulty: 'easy', totalDistance: 4000, estimatedDuration: 150, elevationGain: 200,
    startPoint: { lat: -2.49, lng: 29.40 }, endPoint: { lat: -2.495, lng: 29.32 },
    path: generateTrailPath([{ lat: -2.49, lng: 29.40 }, { lat: -2.492, lng: 29.38 }, { lat: -2.494, lng: 29.35 }, { lat: -2.495, lng: 29.32 }], 1900, 100),
    attractions: [attractions[5]], restAreas: [restAreas[7]]
  },
  {
    id: 'trail-muzimu', name: 'Muzimu Trail',
    description: 'Discover the ancient Muzimu forest in the northeastern section, known for its old-growth trees and orchids.',
    difficulty: 'difficult', totalDistance: 8500, estimatedDuration: 300, elevationGain: 480,
    startPoint: { lat: -2.40, lng: 29.30 }, endPoint: { lat: -2.37, lng: 29.38 },
    path: generateTrailPath([{ lat: -2.40, lng: 29.30 }, { lat: -2.39, lng: 29.32 }, { lat: -2.38, lng: 29.34 }, { lat: -2.375, lng: 29.36 }, { lat: -2.37, lng: 29.38 }], 2400, 250),
    attractions: [attractions[4], attractions[7]], restAreas: [restAreas[4]]
  }
];

export function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestPointOnTrail(userLocation: { lat: number; lng: number }, trail: Trail) {
  let nearestPoint = trail.path[0];
  let nearestIndex = 0;
  let minDistance = calculateDistance(userLocation, trail.path[0]);
  trail.path.forEach((point, index) => {
    const distance = calculateDistance(userLocation, point);
    if (distance < minDistance) { minDistance = distance; nearestPoint = point; nearestIndex = index; }
  });
  return { point: nearestPoint, index: nearestIndex, distance: minDistance };
}

export function calculateTrailProgress(userLocation: { lat: number; lng: number }, trail: Trail) {
  const { point } = findNearestPointOnTrail(userLocation, trail);
  const distanceCovered = point.distanceFromStart;
  const distanceRemaining = trail.totalDistance - distanceCovered;
  const estimatedTimeRemaining = Math.round((distanceRemaining / 1000) / 3.5 * 60);
  let nearestRestArea: RestArea | null = null;
  let distanceToNearestRestArea = Infinity;
  trail.restAreas.forEach(ra => {
    const dist = calculateDistance(userLocation, ra.coordinates);
    if (dist < distanceToNearestRestArea) { distanceToNearestRestArea = dist; nearestRestArea = ra; }
  });
  const nearbyAttractions = trail.attractions.map(a => ({ ...a, distance: calculateDistance(userLocation, a.coordinates) })).filter(a => a.distance < 500).sort((a, b) => a.distance - b.distance);
  return {
    distanceCovered, distanceRemaining, estimatedTimeRemaining,
    currentElevation: point.elevation, nearestRestArea,
    distanceToNearestRestArea: Math.round(distanceToNearestRestArea),
    nearbyAttractions, percentComplete: Math.round((distanceCovered / trail.totalDistance) * 100)
  };
}
