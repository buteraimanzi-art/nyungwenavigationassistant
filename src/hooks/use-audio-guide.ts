import { useEffect, useRef, useState, useCallback } from 'react';
import type { Trail, UserLocation, Attraction, RestArea } from '@/lib/types';
import { calculateDistance } from '@/lib/trail-data';

interface AudioPoint {
  id: string;
  name: string;
  description: string;
  coordinates: { lat: number; lng: number };
  kind: 'attraction' | 'rest' | 'start';
}

interface Options {
  /** trigger radius in meters */
  radius?: number;
}

/**
 * Auto-narrating audio guide using browser SpeechSynthesis.
 *
 * IMPORTANT: Browsers block speechSynthesis.speak() unless the very
 * first utterance has been kicked off from a user gesture. The hook
 * exposes `prime()` which MUST be called inside an onClick handler
 * (synchronously) before any automatic narration can succeed.
 */
export function useAudioGuide(
  trail: Trail | null,
  userLocation: UserLocation | null,
  enabled: boolean,
  opts: Options = {},
) {
  const radius = opts.radius ?? 60;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpoken, setLastSpoken] = useState<string | null>(null);
  const [primed, setPrimed] = useState(false);
  const spokenRef = useRef<Set<string>>(new Set());
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      try {
        // Resume in case the engine was paused by the OS / tab switch
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.95;
        u.pitch = 1;
        u.volume = 1;
        u.lang = 'en-US';
        u.onstart = () => setIsSpeaking(true);
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
        setLastSpoken(text);
      } catch {
        setIsSpeaking(false);
      }
    },
    [supported],
  );

  /**
   * Must be called from a user gesture (button click). Speaks a short
   * welcome line so the audio engine is unlocked for later automatic
   * narrations triggered by location changes.
   */
  const prime = useCallback(
    (welcome?: string) => {
      if (!supported) return;
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(
          welcome ?? 'Audio guide enabled. I will narrate points of interest as you approach them.',
        );
        u.rate = 0.95;
        u.pitch = 1;
        u.volume = 1;
        u.lang = 'en-US';
        u.onstart = () => setIsSpeaking(true);
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
        setLastSpoken(u.text);
        setPrimed(true);
      } catch {
        // ignore
      }
    },
    [supported],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  const reset = useCallback(() => {
    spokenRef.current.clear();
    stop();
  }, [stop]);

  // Auto-narrate when entering a trigger radius
  useEffect(() => {
    if (!enabled || !primed || !trail || !userLocation || !supported) return;
    const points: AudioPoint[] = [
      ...trail.attractions.map<AudioPoint>((a: Attraction) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        coordinates: a.coordinates,
        kind: 'attraction',
      })),
      ...trail.restAreas.map<AudioPoint>((r: RestArea) => ({
        id: r.id,
        name: r.name,
        description: `Rest area with ${r.amenities.join(', ')}. Capacity around ${r.capacity}.`,
        coordinates: r.coordinates,
        kind: 'rest',
      })),
    ];

    for (const p of points) {
      if (spokenRef.current.has(p.id)) continue;
      const d = calculateDistance(userLocation, p.coordinates);
      if (d <= radius) {
        spokenRef.current.add(p.id);
        const intro =
          p.kind === 'attraction'
            ? `You are approaching ${p.name}.`
            : `Rest area ahead: ${p.name}.`;
        speak(`${intro} ${p.description}`);
        break;
      }
    }
  }, [enabled, primed, trail, userLocation, radius, supported, speak]);

  // Stop speaking if disabled
  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  return { isSpeaking, lastSpoken, supported, primed, speak, prime, stop, reset };
}
