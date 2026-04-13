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

// Demo location that simulates a hiker walking near Uwinka reception area
// Starts near Uwinka and slowly moves along trails in the park
export function useDemoLocation(): UseLocationReturn {
  // Start near Uwinka reception (-2.4625, 29.198) — the central hub
  const [location, setLocation] = useState<UserLocation>({
    lat: -2.464, lng: 29.195, accuracy: 12, timestamp: Date.now(), heading: 45, speed: 0.8
  });

  useEffect(() => {
    // Simulate walking along a trail path near Uwinka
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLocation(prev => {
        // Gentle walk along a realistic path near the trails
        // Moves slowly south-east then curves back, staying inside the park
        const phase = (step % 60) / 60; // 0→1 cycle every ~2.5 min
        const angle = phase * Math.PI * 2;
        
        // Wander within ~1km of Uwinka area
        const baseLat = -2.4625;
        const baseLng = 29.198;
        const wanderLat = Math.sin(angle) * 0.004 + Math.cos(angle * 0.7) * 0.002;
        const wanderLng = Math.cos(angle) * 0.005 + Math.sin(angle * 1.3) * 0.002;
        
        const newLat = baseLat + wanderLat;
        const newLng = baseLng + wanderLng;
        
        const heading = Math.atan2(newLng - prev.lng, prev.lat - newLat) * (180 / Math.PI);
        return {
          lat: newLat,
          lng: newLng,
          timestamp: Date.now(),
          heading: (heading + 360) % 360,
          speed: 0.6 + Math.random() * 0.8,
          accuracy: 8 + Math.random() * 8,
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return { location, error: null, isLoading: false, isSupported: true, refresh: () => {} };
}
