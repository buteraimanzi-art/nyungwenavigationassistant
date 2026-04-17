import { useEffect, useState } from 'react';
import { fetchRoute, type RouteResult } from '@/lib/navigation';
import type { Reception } from '@/lib/receptions';
import type { Coordinates } from '@/lib/types';

/**
 * Fetches a real-road route from a reception to a trail start point via OSRM.
 * Returns null while loading or when no inputs are provided.
 */
export function useRealRoute(
  enabled: boolean,
  reception: Reception | null,
  trailStart: Coordinates | null,
): { route: RouteResult | null; loading: boolean } {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !reception || !trailStart) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchRoute(reception, trailStart).then((r) => {
      if (!cancelled) {
        setRoute(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, reception?.id, trailStart?.lat, trailStart?.lng]);

  return { route, loading };
}
