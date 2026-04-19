import { useAudioGuide } from '@/hooks/use-audio-guide';
import type { Trail, UserLocation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Headphones, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface Props {
  trail: Trail | null;
  userLocation: UserLocation | null;
}

/**
 * Floating audio-guide control. When enabled, automatically narrates
 * attractions and rest areas as the user approaches them on the trail.
 */
export function AudioGuide({ trail, userLocation }: Props) {
  const [enabled, setEnabled] = useState(false);
  const { isSpeaking, lastSpoken, supported, stop, reset } = useAudioGuide(
    trail,
    userLocation,
    enabled,
    { radius: 80 },
  );

  if (!supported || !trail) return null;

  return (
    <Card className="fixed bottom-24 left-4 z-30 w-72 max-w-[calc(100vw-2rem)] p-3 shadow-lg border-border/60">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Audio Guide</p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {enabled ? (isSpeaking ? 'Narrating…' : 'Listening for points…') : 'Off'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={enabled ? 'default' : 'outline'}
          className="h-7 px-2 text-xs"
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            if (!next) stop();
          }}
        >
          {enabled ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span className="ml-1">{enabled ? 'Stop' : 'Start'}</span>
        </Button>
      </div>
      {lastSpoken && enabled && (
        <p className="text-[11px] text-muted-foreground line-clamp-3 border-l-2 border-primary/40 pl-2 mb-2">
          {lastSpoken}
        </p>
      )}
      {enabled && (
        <Button
          size="sm"
          variant="ghost"
          className="w-full h-7 text-xs text-muted-foreground"
          onClick={reset}
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Reset narration
        </Button>
      )}
    </Card>
  );
}
