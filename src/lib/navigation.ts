import type { Coordinates } from './types';
import { calculateDistance } from './trail-data';
import type { Reception } from './receptions';

export type TurnDirection = 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'arrive' | 'start';

export interface NavStep {
  id: number;
  instruction: string;
  direction: TurnDirection;
  coordinate: Coordinates;
  distanceFromPrev: number; // meters
  cumulativeDistance: number; // meters
}

/**
 * Generate simulated turn-by-turn waypoints between a reception and a trail start.
 * In a real app this would come from a routing API; here we interpolate and add realistic turns.
 */
export function generateRoute(reception: Reception, trailStart: Coordinates): NavStep[] {
  const steps: NavStep[] = [];
  const totalDist = calculateDistance(reception.coordinates, trailStart);

  // Create intermediate waypoints with slight offsets to simulate a winding road
  const numWaypoints = Math.max(4, Math.min(10, Math.round(totalDist / 800)));
  const waypoints: Coordinates[] = [reception.coordinates];

  for (let i = 1; i < numWaypoints; i++) {
    const t = i / numWaypoints;
    const lat = reception.coordinates.lat + (trailStart.lat - reception.coordinates.lat) * t;
    const lng = reception.coordinates.lng + (trailStart.lng - reception.coordinates.lng) * t;
    // Add small random offsets to simulate road curves
    const seed = Math.sin(i * 47.3) * 0.5 + 0.5;
    const offset = (seed - 0.5) * 0.004;
    waypoints.push({ lat: lat + offset * 0.6, lng: lng + offset });
  }
  waypoints.push(trailStart);

  // Compute bearing between two consecutive segments to determine turn direction
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
      instruction = 'Arrive at trailhead – you made it!';
    } else {
      // Calculate turn angle from prev→curr→next
      const next = waypoints[i + 1];
      const bearingIn = getBearing(prev, curr);
      const bearingOut = getBearing(curr, next);
      let turnAngle = bearingOut - bearingIn;
      if (turnAngle > 180) turnAngle -= 360;
      if (turnAngle < -180) turnAngle += 360;

      if (turnAngle > 30) {
        direction = turnAngle > 70 ? 'right' : 'slight-right';
      } else if (turnAngle < -30) {
        direction = turnAngle < -70 ? 'left' : 'slight-left';
      } else {
        direction = 'straight';
      }
      instruction = getInstruction(direction, segDist);
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

  return steps;
}

function getBearing(from: Coordinates, to: Coordinates): number {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function getInstruction(dir: TurnDirection, dist: number): string {
  const distStr = dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`;
  switch (dir) {
    case 'left': return `Turn left and continue for ${distStr}`;
    case 'right': return `Turn right and continue for ${distStr}`;
    case 'slight-left': return `Bear left and continue for ${distStr}`;
    case 'slight-right': return `Bear right and continue for ${distStr}`;
    case 'straight': return `Continue straight for ${distStr}`;
    default: return `Continue for ${distStr}`;
  }
}

/**
 * Find which step the user is currently on based on proximity.
 */
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
    case 'arrive': return '🏁';
    default: return '⬆️';
  }
}
