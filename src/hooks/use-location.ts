import { useState, useEffect, useCallback } from 'react';
import type { UserLocation } from '@/lib/types';

interface UseLocationReturn {
  location: UserLocation | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
  refresh: () => void;
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

  return { location, error, isLoading, isSupported, refresh };
}

export function useDemoLocation(): UseLocationReturn {
  const [location, setLocation] = useState<UserLocation>({
    lat: -2.475, lng: 29.20, accuracy: 15, timestamp: Date.now(), heading: 0, speed: 1.0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLocation(prev => {
        const newLat = Math.max(-2.50, Math.min(-2.38, prev.lat - 0.0008 + (Math.random() - 0.5) * 0.0003));
        const newLng = Math.max(29.08, Math.min(29.42, prev.lng + (Math.random() - 0.4) * 0.0004));
        const heading = Math.atan2(newLng - prev.lng, prev.lat - newLat) * (180 / Math.PI);
        return { ...prev, lat: newLat, lng: newLng, timestamp: Date.now(), heading: (heading + 360) % 360, speed: 0.8 + Math.random() * 0.6, accuracy: 10 + Math.random() * 10 };
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return { location, error: null, isLoading: false, isSupported: true, refresh: () => {} };
}
