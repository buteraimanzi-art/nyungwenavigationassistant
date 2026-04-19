/**
 * Relive API client + types.
 *
 * Mirrors the official Relive Public API v1 (https://public.api.relive.cc/v1/swagger.json).
 * The interfaces match the Relive schema 1:1 so the UI can be wired to the real API
 * by replacing `mockReliveClient` with a fetch-based implementation that reads
 * `VITE_RELIVE_BASE` and a Bearer access_token from Lovable Cloud.
 *
 * For now we ship a deterministic set of demo activities recorded around Nyungwe so
 * the UI is "real" (loadable, sharable, mappable) without requiring per-user OAuth.
 */

import type { Coordinates } from './types';
import { trails } from './trail-data';

// ─── Schema (matches swagger components.schemas) ────────────────────────────

export type ReliveActivityType = 'ride' | 'run' | 'hike' | 'ski' | 'snowboard' | 'other';
export type ReliveActivityState = 'failed' | 'done' | 'editing' | 'pending-render' | 'blocked-premium';

export interface ReliveUser {
  user_id: string;
  display_name: string;
  /** Not in spec, added for richer UI. Optional avatar URL. */
  avatar_url?: string;
  /** Country flag emoji or ISO code, optional. */
  country?: string;
}

export interface ReliveMomentLocation {
  lat: number;
  lon: number;
  /** Distance from start in meters. */
  distance: number;
  map_url?: string;
}

export interface ReliveMomentMedia {
  type: 'image' | 'video';
  height: number;
  width: number;
  url: string;
}

export interface ReliveMoment {
  moment_at: string;
  location: ReliveMomentLocation;
  media: ReliveMomentMedia[];
}

export interface ReliveActivity {
  id: string;
  state: ReliveActivityState;
  /** ISO timestamp when the activity took place. */
  activity_at: string;
  type: ReliveActivityType;
  /** Moving time in seconds. */
  moving_time: number;
  /** Distance in meters. */
  distance: number;
  /** Elevation gain in meters. */
  elevation_gain: number;
  name: string;
  /** Public Relive video URL. */
  url?: string;
  poster_square_url?: string;
  poster_url?: string;
  map_url?: string;
  moments: ReliveMoment[];
  /** Not in spec but useful — author of the activity. */
  user?: ReliveUser;
  /** Optional Nyungwe trail this activity is associated with (not in spec). */
  trail_id?: string;
}

export interface ReliveActivitiesResponse {
  next_pagination_token: string;
  activities: ReliveActivity[];
}

export interface ReliveUploadResponse {
  id: string;
  name?: string;
  type?: ReliveActivityType;
  external_id: string;
  status: 'done' | 'processing' | 'failed';
  activity_id?: string;
  status_reason?: string;
}

export interface ReliveTokenResponse {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: 'Bearer';
  expires_in: number;
}

// ─── Demo data (deterministic, Nyungwe-themed) ──────────────────────────────

const DEMO_USERS: ReliveUser[] = [
  { user_id: 'u_aline', display_name: 'Aline Mukamana', country: '🇷🇼' },
  { user_id: 'u_kwame', display_name: 'Kwame Owusu', country: '🇬🇭' },
  { user_id: 'u_lena', display_name: 'Lena Hofer', country: '🇨🇭' },
  { user_id: 'u_diego', display_name: 'Diego Marques', country: '🇧🇷' },
  { user_id: 'u_priya', display_name: 'Priya Iyer', country: '🇮🇳' },
];

/** Build a moments timeline along a path (every ~600m) with sample photos. */
function buildMoments(path: Coordinates[], totalDist: number, photoSeed: number): ReliveMoment[] {
  if (path.length === 0) return [];
  const targetCount = Math.max(3, Math.min(8, Math.round(totalDist / 600)));
  const step = Math.max(1, Math.floor(path.length / targetCount));
  const moments: ReliveMoment[] = [];
  for (let i = 0; i < path.length; i += step) {
    const p = path[i];
    const fraction = i / Math.max(1, path.length - 1);
    moments.push({
      moment_at: new Date(Date.now() - 86400000 * 7 + fraction * 4 * 3600 * 1000).toISOString(),
      location: {
        lat: p.lat,
        lon: p.lng,
        distance: Math.round(fraction * totalDist),
      },
      media: [
        {
          type: 'image',
          width: 1080,
          height: 1080,
          // Picsum is a public, no-auth photo placeholder service — perfect for demo.
          url: `https://picsum.photos/seed/nyungwe-${photoSeed}-${i}/640/640`,
        },
      ],
    });
  }
  return moments;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function activityFor(
  trailId: string,
  user: ReliveUser,
  daysAgo: number,
  paceMultiplier: number,
  idx: number,
): ReliveActivity | null {
  const trail = trails.find((t) => t.id === trailId);
  if (!trail) return null;
  const path = trail.path.map((p) => ({ lat: p.lat, lng: p.lng }));
  const totalDist = trail.totalDistance;
  const movingTime = (trail.estimatedDuration * 60) * paceMultiplier;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const id = `act_${trailId}_${user.user_id}_${pad(idx)}`;
  const moments = buildMoments(path, totalDist, idx + daysAgo);
  return {
    id,
    state: 'done',
    activity_at: date.toISOString(),
    type: 'hike',
    moving_time: Math.round(movingTime),
    distance: Math.round(totalDist),
    elevation_gain: Math.round(trail.elevationGain * (0.85 + (idx % 5) * 0.06)),
    name: `${trail.name} • ${user.display_name.split(' ')[0]}'s adventure`,
    url: `https://www.relive.cc/view/${id}`,
    poster_url: moments[0]?.media[0]?.url,
    poster_square_url: moments[0]?.media[0]?.url,
    map_url: undefined, // would be served by /activity/{id}/map
    moments,
    user,
    trail_id: trailId,
  };
}

/** Deterministic curated feed of recent Nyungwe activities. */
function buildDemoActivities(): ReliveActivity[] {
  const seeds: Array<{ trail: string; user: number; daysAgo: number; pace: number }> = [
    { trail: 'trail-canopy-walk', user: 0, daysAgo: 2, pace: 1.0 },
    { trail: 'trail-igishigishigi', user: 1, daysAgo: 3, pace: 0.95 },
    { trail: 'trail-isumo-waterfall', user: 2, daysAgo: 5, pace: 1.15 },
    { trail: 'trail-bigugu', user: 3, daysAgo: 7, pace: 1.3 },
    { trail: 'trail-canopy-walk', user: 4, daysAgo: 9, pace: 1.05 },
    { trail: 'trail-kamiranzovu-marsh', user: 0, daysAgo: 11, pace: 1.1 },
    { trail: 'trail-ngabwe', user: 1, daysAgo: 14, pace: 1.0 },
    { trail: 'trail-isumo-waterfall', user: 2, daysAgo: 18, pace: 1.2 },
    { trail: 'trail-igishigishigi', user: 3, daysAgo: 21, pace: 0.9 },
  ];
  const out: ReliveActivity[] = [];
  seeds.forEach((s, i) => {
    const a = activityFor(s.trail, DEMO_USERS[s.user % DEMO_USERS.length], s.daysAgo, s.pace, i);
    if (a) out.push(a);
  });
  return out;
}

let _cache: ReliveActivity[] | null = null;
function demoActivities(): ReliveActivity[] {
  if (!_cache) _cache = buildDemoActivities();
  return _cache;
}

// ─── Public client ──────────────────────────────────────────────────────────

/**
 * Mock implementation of the Relive Public API.
 *
 * To swap to the real API later:
 *   - set VITE_RELIVE_API_BASE=https://public.api.relive.cc/v1
 *   - replace each method body with `fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}` } })`
 *   - per-user OAuth token lives in Lovable Cloud (server-side).
 */
export const reliveClient = {
  /** GET /user/ */
  async getUser(): Promise<ReliveUser> {
    await tinyDelay();
    return { user_id: 'u_demo', display_name: 'Demo Hiker', country: '🌍' };
  },

  /** GET /user/activities */
  async getUserActivities(_paginationToken?: string): Promise<ReliveActivitiesResponse> {
    await tinyDelay();
    return {
      next_pagination_token: '',
      activities: demoActivities(),
    };
  },

  /** GET /activity/{id} */
  async getActivity(id: string): Promise<ReliveActivity | null> {
    await tinyDelay();
    return demoActivities().find((a) => a.id === id) ?? null;
  },

  /** Convenience (not in spec) — activities for a specific Nyungwe trail. */
  async getActivitiesForTrail(trailId: string): Promise<ReliveActivity[]> {
    await tinyDelay();
    return demoActivities().filter((a) => a.trail_id === trailId);
  },

  /** POST /upload — simulate uploading a recorded GPX. */
  async uploadActivity(input: {
    file: Blob | { points: Coordinates[]; startedAt: string; endedAt: string };
    external_id: string;
    name?: string;
    type?: ReliveActivityType;
  }): Promise<ReliveUploadResponse> {
    await tinyDelay(800);
    const id = `upl_${Math.random().toString(36).slice(2, 10)}`;
    const activityId = `act_user_${Math.random().toString(36).slice(2, 10)}`;
    return {
      id,
      external_id: input.external_id,
      name: input.name,
      type: input.type ?? 'hike',
      status: 'done',
      activity_id: activityId,
    };
  },

  /** GET /upload/{id} */
  async getUpload(id: string): Promise<ReliveUploadResponse> {
    await tinyDelay();
    return {
      id,
      external_id: 'demo',
      status: 'done',
      activity_id: `act_${id}`,
    };
  },

  /** Build the static /activity/{id}/map URL — real Relive serves a PNG. */
  buildMapUrl(activityId: string): string {
    return `https://public.api.relive.cc/v1/activity/${activityId}/map`;
  },

  /** Build the moment-map URL for a specific lat/lon along the activity. */
  buildMomentMapUrl(activityId: string, lat: number, lon: number): string {
    const encoded = btoa(`${lat},${lon}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `https://public.api.relive.cc/v1/activity/${activityId}/moment-map/${encoded}`;
  },
};

function tinyDelay(ms = 250): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Formatting helpers ─────────────────────────────────────────────────────

export function formatReliveDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function formatReliveDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatReliveDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const days = Math.floor((now - d.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
