import { useAudioGuide } from '@/hooks/use-audio-guide';
import type { Trail, UserLocation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Headphones, Volume2, VolumeX, RotateCcw, Play } from 'lucide-react';
import { useState } from 'react';

interface Props {
  trail: Trail | null;
  userLocation: UserLocation | null;
}

/**
 * Floating audio-guide control. Tap "Start" to enable + prime the
 * speech engine (required by browsers — must happen in the click
 * handler). Once primed, the guide automatically narrates attractions
 * and rest areas as the user approaches them.
 */
export function AudioGuide({ trail, userLocation }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { isSpeaking, lastSpoken, supported, primed, stop, reset, prime, speak } = useAudioGuide(
    trail,
    userLocation,
    enabled,
    { radius: 80 },
  );

  if (!supported || !trail) return null;

  const handleStart = () => {
    try {
      prime(`Welcome to ${trail.name}. I will guide you along the trail.`);
      setEnabled(true);
      setMessage('Audio guide ready. Tap Test if you do not hear the welcome message.');
    } catch {
      setMessage('Audio guide could not start on this device yet. Please tap Test.');
    }
  };

  const handleStop = () => {
    stop();
    setEnabled(false);
    setMessage('Audio guide stopped.');
  };

  const handleTest = () => {
    setMessage('Playing test audio…');
    speak(`Audio guide is working. You are on the ${trail.name} trail.`);
  };

  return (
    <Card className="fixed bottom-24 left-3 right-3 sm:right-auto sm:left-4 z-30 sm:w-72 max-w-[calc(100vw-1.5rem)] p-3 shadow-lg border-border/60">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-full shrink-0 ${enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Headphones className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Audio Guide</p>
            <p className="text-[11px] text-muted-foreground leading-tight truncate">
              {enabled
                ? isSpeaking
                  ? 'Narrating…'
                  : primed
                    ? 'Listening for points…'
                    : 'Tap test to start'
                : 'Off'}
            </p>
          </div>
        </div>
        {enabled ? (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs shrink-0" onClick={handleStop}>
            <VolumeX className="w-3.5 h-3.5" />
            <span className="ml-1">Stop</span>
          </Button>
        ) : (
          <Button size="sm" className="h-7 px-2 text-xs shrink-0" onClick={handleStart}>
            <Volume2 className="w-3.5 h-3.5" />
            <span className="ml-1">Start</span>
          </Button>
        )}
      </div>
      {lastSpoken && enabled && (
        <p className="text-[11px] text-muted-foreground line-clamp-3 border-l-2 border-primary/40 pl-2 mb-2">
          {lastSpoken}
        </p>
      )}
      {message && (
        <p className="mb-2 text-[11px] text-muted-foreground">
          {message}
        </p>
      )}
      {enabled && (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs text-muted-foreground" onClick={handleTest}>
            <Play className="w-3 h-3 mr-1" /> Test
          </Button>
          <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs text-muted-foreground" onClick={reset}>
            <RotateCcw className="w-3 h-3 mr-1" /> Reset
          </Button>
        </div>
      )}
    </Card>
  );
}
