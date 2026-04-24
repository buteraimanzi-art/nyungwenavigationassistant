import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { UserLocation, Trail } from '@/lib/types';

/**
 * Pushes the current user's GPS position to public.user_locations
 * so park admins can see hikers in real time. Throttled to ~10s.
 */
export function useLocationBroadcast(location: UserLocation | null, trail: Trail | null) {
  const { user } = useAuth();
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !location) return;
    const now = Date.now();
    if (now - lastSentRef.current < 10_000) return;
    lastSentRef.current = now;

    supabase
      .from('user_locations')
      .upsert({
        user_id: user.id,
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy ?? null,
        heading: location.heading ?? null,
        speed: location.speed ?? null,
        trail_id: trail?.id ?? null,
        trail_name: trail?.name ?? null,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn('location broadcast failed', error.message);
      });
  }, [user?.id, location, trail?.id]);
}
