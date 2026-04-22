import type { Coordinates, Trail } from './types';
import { calculateDistance } from './trail-data';
import {
  NYUNGWE_BBOX,
  NYUNGWE_CENTROID,
  clampToNyungwePolygon,
  pointInNyungwe,
} from './nyungwe-boundary';

/**
 * Backwards-compatible bbox export — some callers (and the map) used
 * NYUNGWE_FOREST_BOUNDS to draw the boundary. We keep it for layout
 * code, but the source of truth is now the polygon.
 */
export const NYUNGWE_FOREST_BOUNDS = NYUNGWE_BBOX;

const FOREST_CENTER = NYUNGWE_CENTROID;

function clampToForest(p: Coordinates): Coordinates {
  return clampToNyungwePolygon(p);
}

/**
 * Maximum loop radius (degrees) that still fits inside the polygon
 * given an anchor. Approximated by sampling the available room in
 * 16 directions and taking the smallest distance to the boundary.
 */
function maxRadiusForAnchor(anchor: Coordinates): number {
  if (!pointInNyungwe(anchor)) return 0.005;
  let minR = 0.05;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    let lo = 0, hi = 0.1; // search up to ~11km in degrees
    // Find the largest hi inside the polygon
    while (hi - lo > 0.0005) {
      const mid = (lo + hi) / 2;
      const test: Coordinates = {
        lat: anchor.lat + Math.sin(a) * mid,
        lng: anchor.lng + Math.cos(a) * mid,
      };
      if (pointInNyungwe(test)) lo = mid;
      else hi = mid;
    }
    if (lo < minR) minR = lo;
  }
  return Math.max(0.001, minR * 0.85);
}

/**
 * Generate an organic round-trip loop for a trail that stays INSIDE the
 * Nyungwe forest polygon. Outbound and return paths follow different
 * curved arcs around the trail anchor, and very long trails are folded
 * into a serpentine pattern so they don't spill outside the park.
 */
export function generateTrailLoop(trail: Trail): Coordinates[] {
  const anchor = clampToForest(trail.startPoint || FOREST_CENTER);

  const desiredRadiusDeg = (trail.totalDistance / 1000) / (2 * Math.PI * 111);
  const maxR = maxRadiusForAnchor(anchor);

  const seedNum = trail.id
    .split('')
    .reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const rand = (i: number) => {
    const x = Math.sin(seedNum * 0.013 + i * 1.7) * 10000;
    return x - Math.floor(x);
  };

  if (desiredRadiusDeg <= maxR * 0.95) {
    const radiusDeg = Math.max(0.0015, desiredRadiusDeg);
    return buildSimpleLoop(anchor, radiusDeg, rand);
  }
  return buildSerpentineLoop(anchor, maxR, rand, seedNum);
}

function buildSimpleLoop(
  center: Coordinates,
  radiusDeg: number,
  rand: (i: number) => number,
): Coordinates[] {
  const outboundPts = 22;
  const returnPts = 22;
  const points: Coordinates[] = [center];

  for (let i = 1; i <= outboundPts; i++) {
    const t = i / outboundPts;
    const angle = Math.PI * t;
    const noise = (rand(i) - 0.5) * 0.25;
    const r = radiusDeg * (1 + noise);
    const lat = center.lat + Math.sin(angle) * r * 0.85;
    const lng = center.lng + Math.cos(angle) * r;
    const wobble = (rand(i + 100) - 0.5) * radiusDeg * 0.12;
    points.push(clampToForest({ lat: lat + wobble, lng: lng + wobble * 0.7 }));
  }

  for (let i = 1; i <= returnPts; i++) {
    const t = i / returnPts;
    const angle = Math.PI + Math.PI * t;
    const noise = (rand(i + 50) - 0.5) * 0.3;
    const r = radiusDeg * (1.05 + noise) * 0.95;
    const lat = center.lat + Math.sin(angle) * r * 0.85;
    const lng = center.lng + Math.cos(angle) * r;
    const wobble = (rand(i + 200) - 0.5) * radiusDeg * 0.12;
    points.push(clampToForest({ lat: lat + wobble, lng: lng + wobble * 0.7 }));
  }

  points.push(center);
  return points;
}

function buildSerpentineLoop(
  center: Coordinates,
  maxR: number,
  rand: (i: number) => number,
  seedNum: number,
): Coordinates[] {
  const halfW = maxR;
  const halfH = maxR * 0.78;
  const sweeps = 4 + (seedNum % 3);
  const ptsPerSweep = 14;

  const points: Coordinates[] = [center];

  for (let s = 0; s < sweeps; s++) {
    const yT = s / (sweeps - 1);
    const lat = center.lat - halfH + 2 * halfH * yT;
    const goingRight = s % 2 === 0;
    for (let i = 0; i < ptsPerSweep; i++) {
      const t = i / (ptsPerSweep - 1);
      const xT = goingRight ? t : 1 - t;
      const lng = center.lng - halfW + 2 * halfW * xT;
      const noise = (rand(s * 13 + i * 3) - 0.5) * maxR * 0.08;
      points.push(clampToForest({ lat: lat + noise, lng: lng + noise * 0.6 }));
    }
  }

  const returnPts = 22;
  for (let i = 1; i <= returnPts; i++) {
    const t = i / returnPts;
    const angle = Math.PI + Math.PI * t;
    const r = maxR * (0.55 + (rand(i + 999) - 0.5) * 0.15);
    const lat = center.lat + Math.sin(angle) * r * 0.6 - halfH * 0.3;
    const lng = center.lng + Math.cos(angle) * r;
    points.push(clampToForest({ lat, lng }));
  }

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
  const sat = 70 + (hash % 20);
  const light = 42 + ((hash >> 3) % 12);
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
