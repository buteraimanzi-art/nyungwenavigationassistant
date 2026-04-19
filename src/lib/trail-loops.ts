import type { Coordinates, Trail } from './types';
import { calculateDistance } from './trail-data';

/**
 * Generate an organic round-trip loop for a trail.
 * Outbound and return paths follow DIFFERENT curved arcs around the
 * trail anchor so the user does not retrace the same line.
 *
 * The loop is sized to roughly match `trail.totalDistance` (in meters).
 */
export function generateTrailLoop(trail: Trail): Coordinates[] {
  const center = trail.startPoint;
  // approximate radius (deg) so perimeter ≈ trail distance
  // 1 deg lat ≈ 111 km. Loop perimeter ≈ 2πr (deg) * 111km.
  const radiusDeg = Math.max(0.0015, (trail.totalDistance / 1000) / (2 * Math.PI * 111));
  const seedNum = trail.id
    .split('')
    .reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const rand = (i: number) => {
    const x = Math.sin(seedNum * 0.013 + i * 1.7) * 10000;
    return x - Math.floor(x);
  };

  const outboundPts = 22;
  const returnPts = 22;
  const points: Coordinates[] = [center];

  // Outbound: arc on one side (angle 0 → π) with organic noise
  for (let i = 1; i <= outboundPts; i++) {
    const t = i / outboundPts;
    const angle = Math.PI * t; // 0 → π (top half)
    const noise = (rand(i) - 0.5) * 0.35;
    const r = radiusDeg * (1 + noise);
    const lat = center.lat + Math.sin(angle) * r * 0.85; // squash lat slightly
    const lng = center.lng + Math.cos(angle) * r;
    // small per-point wobble to feel like a real footpath
    const wobble = (rand(i + 100) - 0.5) * radiusDeg * 0.15;
    points.push({ lat: lat + wobble, lng: lng + wobble * 0.7 });
  }

  // Return: arc on the OTHER side (angle π → 2π) — different shape
  for (let i = 1; i <= returnPts; i++) {
    const t = i / returnPts;
    const angle = Math.PI + Math.PI * t; // π → 2π (bottom half)
    const noise = (rand(i + 50) - 0.5) * 0.4;
    const r = radiusDeg * (1.05 + noise) * 0.95; // slightly different radius
    const lat = center.lat + Math.sin(angle) * r * 0.85;
    const lng = center.lng + Math.cos(angle) * r;
    const wobble = (rand(i + 200) - 0.5) * radiusDeg * 0.15;
    points.push({ lat: lat + wobble, lng: lng + wobble * 0.7 });
  }

  // Close loop back to start
  points.push(center);
  return points;
}

/** Stable distinct color per trail id (HSL) */
export function getTrailColor(trailId: string): string {
  let hash = 0;
  for (let i = 0; i < trailId.length; i++) {
    hash = (hash * 31 + trailId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  const sat = 70 + (hash % 20); // 70-89
  const light = 42 + ((hash >> 3) % 12); // 42-53
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

/** Place rest areas evenly along the loop, on the actual loop path. */
export function placeRestAreasOnLoop(
  loop: Coordinates[],
  count: number,
): Coordinates[] {
  if (loop.length < 2 || count <= 0) return [];
  const step = Math.floor(loop.length / (count + 1));
  const result: Coordinates[] = [];
  for (let i = 1; i <= count; i++) {
    result.push(loop[Math.min(loop.length - 2, i * step)]);
  }
  return result;
}

/** Total length of a polyline, in meters. */
export function loopLength(loop: Coordinates[]): number {
  let total = 0;
  for (let i = 1; i < loop.length; i++) {
    total += calculateDistance(loop[i - 1], loop[i]);
  }
  return total;
}
