import type { Coordinates } from './types';
import { calculateDistance } from './trail-data';
import type { Reception } from './receptions';

export type TurnDirection = 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'arrive' | 'start' | 'uturn';

export interface NavStep {
  id: number;
  instruction: string;
  direction: TurnDirection;
  coordinate: Coordinates;
  distanceFromPrev: number; // meters
  cumulativeDistance: number; // meters
}

export interface RouteResult {
  steps: NavStep[];
  /** Full polyline geometry (every point along the road) for rendering on the map */
  geometry: Coordinates[];
  totalDistance: number; // meters
  totalDuration: number; // seconds
  source: 'osrm' | 'fallback';
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';
const routeCache = new Map<string, RouteResult>();

function osrmManeuverToDirection(maneuver: { type: string; modifier?: string }): TurnDirection {
  const t = maneuver.type;
  const m = maneuver.modifier || '';
  if (t === 'depart') return 'start';
  if (t === 'arrive') return 'arrive';
  if (t === 'continue' && (m === 'straight' || !m)) return 'straight';
  if (m === 'uturn') return 'uturn';
  if (m === 'left' || m === 'sharp left') return 'left';
  if (m === 'right' || m === 'sharp right') return 'right';
  if (m === 'slight left') return 'slight-left';
  if (m === 'slight right') return 'slight-right';
  if (m === 'straight') return 'straight';
  return 'straight';
}

function buildInstruction(dir: TurnDirection, dist: number, road?: string, isLast?: boolean, receptionName?: string): string {
  if (dir === 'start') return `Depart from ${receptionName ?? 'start'}${road ? ` on ${road}` : ''}`;
  if (dir === 'arrive' || isLast) return 'Arrive at trailhead — you made it!';
  const distStr = dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`;
  const onRoad = road ? ` onto ${road}` : '';
  switch (dir) {
    case 'left': return `Turn left${onRoad} and continue for ${distStr}`;
    case 'right': return `Turn right${onRoad} and continue for ${distStr}`;
    case 'slight-left': return `Bear left${onRoad} and continue for ${distStr}`;
    case 'slight-right': return `Bear right${onRoad} and continue for ${distStr}`;
    case 'uturn': return `Make a U-turn${onRoad}`;
    case 'straight': return `Continue straight${onRoad} for ${distStr}`;
    default: return `Continue${onRoad} for ${distStr}`;
  }
}

/**
 * Fetch a real road-following route from OSRM (OpenStreetMap routing).
 * Falls back to an interpolated synthetic route on failure.
 */
export async function fetchRoute(
  reception: Reception,
  trailStart: Coordinates,
): Promise<RouteResult> {
  const cacheKey = `${reception.coordinates.lat},${reception.coordinates.lng}->${trailStart.lat},${trailStart.lng}`;
  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Round trip: reception → trail start → reception (returns via real roads)
    const r = `${reception.coordinates.lng},${reception.coordinates.lat}`;
    const t = `${trailStart.lng},${trailStart.lat}`;
    const url = `${OSRM_BASE}/driving/${r};${t};${r}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error('No route');

    const geometry: Coordinates[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng }),
    );

    const steps: NavStep[] = [];
    let cumDist = 0;
    const legs = route.legs ?? [];
    legs.forEach((leg: { steps: Array<{ maneuver: { type: string; modifier?: string; location: [number, number] }; distance: number; name?: string }> }, legIdx: number) => {
      const isReturnLeg = legIdx === 1;
      leg.steps.forEach((s, i) => {
        // Skip the duplicate "depart" maneuver at the start of the return leg (it's the same point as trail arrival)
        if (isReturnLeg && i === 0) return;
        const dir = osrmManeuverToDirection(s.maneuver);
        cumDist += s.distance;
        const isFinal = legIdx === legs.length - 1 && i === leg.steps.length - 1;
        let instruction: string;
        if (legIdx === 0 && i === 0) {
          instruction = buildInstruction('start', 0, s.name, false, reception.name);
        } else if (isReturnLeg && i === 1) {
          instruction = `Turn around at trailhead and head back to ${reception.name}${s.name ? ` via ${s.name}` : ''}`;
        } else if (isFinal) {
          instruction = `Arrive back at ${reception.name} — round trip complete!`;
        } else {
          instruction = buildInstruction(dir, s.distance, s.name, false, reception.name);
        }
        steps.push({
          id: steps.length,
          instruction,
          direction: isFinal ? 'arrive' : dir,
          coordinate: { lat: s.maneuver.location[1], lng: s.maneuver.location[0] },
          distanceFromPrev: Math.round(s.distance),
          cumulativeDistance: Math.round(cumDist),
        });
      });
    });

    const result: RouteResult = {
      steps,
      geometry,
      totalDistance: route.distance,
      totalDuration: route.duration,
      source: 'osrm',
    };
    routeCache.set(cacheKey, result);
    return result;
  } catch {
    // Fallback to synthetic route
    const fallback = generateSyntheticRoute(reception, trailStart);
    return fallback;
  }
}

/**
 * Synthetic interpolated route, used as a fallback if OSRM is unavailable.
 */
export function generateSyntheticRoute(reception: Reception, trailStart: Coordinates): RouteResult {
  const steps: NavStep[] = [];
  const totalDist = calculateDistance(reception.coordinates, trailStart);
  const numWaypoints = Math.max(4, Math.min(10, Math.round(totalDist / 800)));
  const waypoints: Coordinates[] = [reception.coordinates];

  for (let i = 1; i < numWaypoints; i++) {
    const t = i / numWaypoints;
    const lat = reception.coordinates.lat + (trailStart.lat - reception.coordinates.lat) * t;
    const lng = reception.coordinates.lng + (trailStart.lng - reception.coordinates.lng) * t;
    const seed = Math.sin(i * 47.3) * 0.5 + 0.5;
    const offset = (seed - 0.5) * 0.004;
    waypoints.push({ lat: lat + offset * 0.6, lng: lng + offset });
  }
  waypoints.push(trailStart);

  let cumDist = 0;
  for (let i = 0; i < waypoints.length; i++) {
    const prev = i > 0 ? waypoints[i - 1] : waypoints[0];
    const curr = waypoints[i];
    const segDist = i === 0 ? 0 : calculateDistance(prev, curr);
    cumDist += segDist;

    let direction: TurnDirection;
    let instruction: string;
    if (i === 0) {
      direction = 'start';
      instruction = `Depart from ${reception.name}`;
    } else if (i === waypoints.length - 1) {
      direction = 'arrive';
      instruction = 'Arrive at trailhead — you made it!';
    } else {
      const next = waypoints[i + 1];
      const bearingIn = getBearing(prev, curr);
      const bearingOut = getBearing(curr, next);
      let turnAngle = bearingOut - bearingIn;
      if (turnAngle > 180) turnAngle -= 360;
      if (turnAngle < -180) turnAngle += 360;
      if (turnAngle > 30) direction = turnAngle > 70 ? 'right' : 'slight-right';
      else if (turnAngle < -30) direction = turnAngle < -70 ? 'left' : 'slight-left';
      else direction = 'straight';
      instruction = buildInstruction(direction, segDist);
    }

    steps.push({
      id: i,
      instruction,
      direction,
      coordinate: curr,
      distanceFromPrev: Math.round(segDist),
      cumulativeDistance: Math.round(cumDist),
    });
  }

  return {
    steps,
    geometry: waypoints,
    totalDistance: cumDist,
    totalDuration: cumDist / 1.4, // walking ~1.4 m/s
    source: 'fallback',
  };
}

/**
 * @deprecated Use `fetchRoute` (async, real roads). Kept for backwards-compat.
 */
export function generateRoute(reception: Reception, trailStart: Coordinates): NavStep[] {
  return generateSyntheticRoute(reception, trailStart).steps;
}

function getBearing(from: Coordinates, to: Coordinates): number {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function findCurrentStep(userLocation: Coordinates, steps: NavStep[]): number {
  let nearestIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < steps.length; i++) {
    const d = calculateDistance(userLocation, steps[i].coordinate);
    if (d < minDist) {
      minDist = d;
      nearestIdx = i;
    }
  }
  return nearestIdx;
}

export function getDirectionIcon(dir: TurnDirection): string {
  switch (dir) {
    case 'start': return '🚩';
    case 'left': return '⬅️';
    case 'right': return '➡️';
    case 'slight-left': return '↖️';
    case 'slight-right': return '↗️';
    case 'straight': return '⬆️';
    case 'uturn': return '↩️';
    case 'arrive': return '🏁';
    default: return '⬆️';
  }
}
