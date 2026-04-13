import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserLocation, Coordinates } from '@/lib/types';

interface UseLocationReturn {
  location: UserLocation | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
  refresh: () => void;
  followRoute: (waypoints: Coordinates[]) => void;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLocation({
      lat: position.coords.latitude, lng: position.coords.longitude,
      accuracy: position.coords.accuracy, timestamp: position.timestamp,
      heading: position.coords.heading ?? undefined, speed: position.coords.speed ?? undefined
    });
    setError(null); setIsLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'Location permission denied. Please enable location access.',
      2: 'Location unavailable. Please check your GPS settings.',
      3: 'Location request timed out.',
    };
    setError(messages[err.code] || 'Unknown location error.');
    setIsLoading(false);
  }, []);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) { setIsSupported(false); setError('Geolocation not supported.'); setIsLoading(false); return; }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }, [handleSuccess, handleError]);

  useEffect(() => {
    if (!navigator.geolocation) { setIsSupported(false); setError('Geolocation not supported.'); setIsLoading(false); return; }
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [handleSuccess, handleError]);

  return { location, error, isLoading, isSupported, refresh, followRoute: () => {} };
}

export function useDemoLocation(): UseLocationReturn {
  const [location, setLocation] = useState<UserLocation>({
    lat: -2.464, lng: 29.195, accuracy: 12, timestamp: Date.now(), heading: 45, speed: 0.8
  });
  const routeRef = useRef<Coordinates[] | null>(null);
  const routeIdxRef = useRef(0);

  const followRoute = useCallback((waypoints: Coordinates[]) => {
    routeRef.current = waypoints;
    routeIdxRef.current = 0;
    if (waypoints.length > 0) {
      setLocation(prev => ({
        ...prev,
        lat: waypoints[0].lat,
        lng: waypoints[0].lng,
        timestamp: Date.now(),
      }));
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocation(prev => {
        const route = routeRef.current;
        if (route && route.length > 0) {
          // Follow the route waypoints
          let idx = routeIdxRef.current;
          if (idx < route.length - 1) {
            idx++;
            routeIdxRef.current = idx;
          }
          const target = route[idx];
          // Smooth interpolation towards target
          const lat = prev.lat + (target.lat - prev.lat) * 0.4;
          const lng = prev.lng + (target.lng - prev.lng) * 0.4;
          const heading = Math.atan2(lng - prev.lng, prev.lat - lat) * (180 / Math.PI);
          return {
            lat, lng,
            timestamp: Date.now(),
            heading: (heading + 360) % 360,
            speed: 1.2 + Math.random() * 0.5,
            accuracy: 6 + Math.random() * 6,
          };
        }
        // Default wander
        const step = (Date.now() / 3000) | 0;
        const phase = (step % 60) / 60;
        const angle = phase * Math.PI * 2;
        const baseLat = -2.4625;
        const baseLng = 29.198;
        const newLat = baseLat + Math.sin(angle) * 0.004 + Math.cos(angle * 0.7) * 0.002;
        const newLng = baseLng + Math.cos(angle) * 0.005 + Math.sin(angle * 1.3) * 0.002;
        const heading = Math.atan2(newLng - prev.lng, prev.lat - newLat) * (180 / Math.PI);
        return {
          lat: newLat, lng: newLng,
          timestamp: Date.now(),
          heading: (heading + 360) % 360,
          speed: 0.6 + Math.random() * 0.8,
          accuracy: 8 + Math.random() * 8,
        };
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return { location, error: null, isLoading: false, isSupported: true, refresh: () => {}, followRoute };
}
