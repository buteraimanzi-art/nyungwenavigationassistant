import type { Coordinates, Trail } from './types';
import { calculateDistance } from './trail-data';

/**
 * Approximate Nyungwe National Park boundary (simplified polygon).
 * Used to keep all generated trail loops inside the forest.
 */
export const NYUNGWE_FOREST_BOUNDS = {
  north: -2.36,
  south: -2.54,
  west: 29.10,
  east: 29.42,
};

/** Center of the forest, used as a fallback anchor for clamping. */
const FOREST_CENTER = {
  lat: (NYUNGWE_FOREST_BOUNDS.north + NYUNGWE_FOREST_BOUNDS.south) / 2,
  lng: (NYUNGWE_FOREST_BOUNDS.west + NYUNGWE_FOREST_BOUNDS.east) / 2,
};

/** Inset margin (degrees) so trails never touch the very edge. */
const EDGE_MARGIN = 0.008;

function clampToForest(p: Coordinates): Coordinates {
  return {
    lat: Math.min(
      NYUNGWE_FOREST_BOUNDS.north - EDGE_MARGIN,
      Math.max(NYUNGWE_FOREST_BOUNDS.south + EDGE_MARGIN, p.lat),
    ),
    lng: Math.min(
      NYUNGWE_FOREST_BOUNDS.east - EDGE_MARGIN,
      Math.max(NYUNGWE_FOREST_BOUNDS.west + EDGE_MARGIN, p.lng),
    ),
  };
}

/**
 * Maximum loop radius (degrees) that still fits comfortably inside the forest
 * given an anchor. Computed as the smaller of the available room in each
 * cardinal direction, with a safety factor.
 */
function maxRadiusForAnchor(anchor: Coordinates): number {
  const room = Math.min(
    anchor.lat - (NYUNGWE_FOREST_BOUNDS.south + EDGE_MARGIN),
    (NYUNGWE_FOREST_BOUNDS.north - EDGE_MARGIN) - anchor.lat,
    anchor.lng - (NYUNGWE_FOREST_BOUNDS.west + EDGE_MARGIN),
    (NYUNGWE_FOREST_BOUNDS.east - EDGE_MARGIN) - anchor.lng,
  );
  return Math.max(0.001, room * 0.9);
}

/**
 * Generate an organic round-trip loop for a trail that stays INSIDE the
 * Nyungwe forest boundary. Outbound and return paths follow different
 * curved arcs around the trail anchor, and very long trails are folded
 * into a serpentine pattern so they don't spill outside the park.
 */
export function generateTrailLoop(trail: Trail): Coordinates[] {
  const anchor = clampToForest(trail.startPoint || FOREST_CENTER);

  // Desired radius if the loop were a perfect circle (deg)
  const desiredRadiusDeg = (trail.totalDistance / 1000) / (2 * Math.PI * 111);
  const maxR = maxRadiusForAnchor(anchor);

  const seedNum = trail.id
    .split('')
    .reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const rand = (i: number) => {
    const x = Math.sin(seedNum * 0.013 + i * 1.7) * 10000;
    return x - Math.floor(x);
  };

  // If the trail comfortably fits as a single loop, use the simple shape.
  if (desiredRadiusDeg <= maxR * 0.95) {
    const radiusDeg = Math.max(0.0015, desiredRadiusDeg);
    return buildSimpleLoop(anchor, radiusDeg, rand);
  }

  // Otherwise, fold into a serpentine that fills the available room.
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

/**
 * Long trails (Congo–Nile, Nshili, Cyinzobe, Uwinka…) get a serpentine
 * shape that fills the available bounded room without leaving the forest.
 */
function buildSerpentineLoop(
  center: Coordinates,
  maxR: number,
  rand: (i: number) => number,
  seedNum: number,
): Coordinates[] {
  // Bounding box around the center, fully inside the forest.
  const halfW = maxR;
  const halfH = maxR * 0.78;
  const sweeps = 4 + (seedNum % 3); // 4-6 vertical sweeps
  const ptsPerSweep = 14;

  const points: Coordinates[] = [center];

  // Outbound: serpentine left-right across the box, going north
  for (let s = 0; s < sweeps; s++) {
    const yT = s / (sweeps - 1); // 0 → 1 (south → north of box)
    const lat = center.lat - halfH + 2 * halfH * yT;
    const goingRight = s % 2 === 0;
    for (let i = 0; i < ptsPerSweep; i++) {
      const t = i / (ptsPerSweep - 1);
      const xT = goingRight ? t : 1 - t;
      const lng = center.lng - halfW + 2 * halfW * xT;
      const noise = (rand(s * 13 + i * 3) - 0.5) * maxR * 0.08;
      points.push(
        clampToForest({ lat: lat + noise, lng: lng + noise * 0.6 }),
      );
    }
  }

  // Return: a curved arc back along the southern half so it doesn't retrace
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
