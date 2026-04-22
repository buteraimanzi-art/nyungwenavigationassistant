import type { Coordinates } from './types';

/**
 * Approximate Nyungwe National Park boundary as a polygon.
 * Coordinates trace the irregular shape of the park (roughly NE→SW),
 * derived from publicly available park outline references and simplified
 * to ~24 vertices for fast point-in-polygon tests on each generated
 * trail coordinate.
 *
 * Order: clockwise, [lng, lat] like GeoJSON, then converted to {lat,lng}.
 */
const RAW_POLYGON: [number, number][] = [
  // [lng, lat] — north tip near Gisakura/Uwinka
  [29.135, -2.378],
  [29.178, -2.372],
  [29.224, -2.388],
  [29.262, -2.402],
  [29.298, -2.418],
  [29.332, -2.430],
  [29.365, -2.448],
  [29.392, -2.470],
  [29.408, -2.495],
  [29.412, -2.520],
  // east / south-east edge
  [29.398, -2.535],
  [29.370, -2.530],
  [29.338, -2.522],
  [29.302, -2.518],
  [29.268, -2.525],
  [29.232, -2.532],
  [29.198, -2.528],
  // south edge
  [29.165, -2.515],
  [29.138, -2.498],
  [29.118, -2.475],
  [29.108, -2.448],
  [29.110, -2.422],
  [29.118, -2.400],
  [29.128, -2.385],
];

export const NYUNGWE_POLYGON: Coordinates[] = RAW_POLYGON.map(([lng, lat]) => ({ lat, lng }));

/** GeoJSON LineString coords [lng, lat] for Leaflet polygon rendering. */
export const NYUNGWE_POLYGON_LATLNG: [number, number][] = NYUNGWE_POLYGON.map((p) => [p.lat, p.lng]);

/** Bounding box of the polygon (still useful as a fast pre-clamp). */
export const NYUNGWE_BBOX = NYUNGWE_POLYGON.reduce(
  (acc, p) => ({
    north: Math.max(acc.north, p.lat),
    south: Math.min(acc.south, p.lat),
    east: Math.max(acc.east, p.lng),
    west: Math.min(acc.west, p.lng),
  }),
  { north: -Infinity, south: Infinity, east: -Infinity, west: Infinity },
);

/** Centroid (simple average — fine for our purposes). */
export const NYUNGWE_CENTROID: Coordinates = {
  lat: NYUNGWE_POLYGON.reduce((s, p) => s + p.lat, 0) / NYUNGWE_POLYGON.length,
  lng: NYUNGWE_POLYGON.reduce((s, p) => s + p.lng, 0) / NYUNGWE_POLYGON.length,
};

/** Standard ray-casting point-in-polygon. */
export function pointInNyungwe(p: Coordinates): boolean {
  let inside = false;
  const poly = NYUNGWE_POLYGON;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lng, yi = poly[i].lat;
    const xj = poly[j].lng, yj = poly[j].lat;
    const intersect =
      yi > p.lat !== yj > p.lat &&
      p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Pull a point toward the centroid until it lies inside the polygon
 * (with a small inset). Cheap and good enough for our generated paths.
 */
export function clampToNyungwePolygon(p: Coordinates, inset = 0.004): Coordinates {
  if (pointInNyungwe(p)) return p;
  const c = NYUNGWE_CENTROID;
  // Binary search the segment from p → centroid for an interior point.
  let lo = 0, hi = 1, best: Coordinates = c;
  for (let k = 0; k < 14; k++) {
    const mid = (lo + hi) / 2;
    const candidate: Coordinates = {
      lat: p.lat + (c.lat - p.lat) * mid,
      lng: p.lng + (c.lng - p.lng) * mid,
    };
    if (pointInNyungwe(candidate)) { best = candidate; hi = mid; } else { lo = mid; }
  }
  // Apply an extra small pull toward centroid as inset margin.
  return {
    lat: best.lat + (c.lat - best.lat) * (inset / 0.05),
    lng: best.lng + (c.lng - best.lng) * (inset / 0.05),
  };
}
