import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRelive } from '@/hooks/use-relive';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import type { Trail } from '@/lib/types';

interface Props {
  trail: Trail;
  /** Seconds the user has been on the trail; used as fake moving_time. */
  durationSec?: number;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function ReliveUploadButton({ trail, durationSec = 0, variant = 'outline', size = 'sm' }: Props) {
  const { isConnected, uploading, uploadCurrentHike, connect, connecting } = useRelive();
  const { toast } = useToast();
  const [done, setDone] = useState(false);

  const handle = async () => {
    if (!isConnected) {
      await connect();
      return;
    }
    const seconds = durationSec > 0 ? durationSec : trail.estimatedDuration * 60;
    const result = await uploadCurrentHike({
      name: `My ${trail.name} hike`,
      trailId: trail.id,
      durationSec: seconds,
    });
    if (result) {
      setDone(true);
      toast({
        title: 'Uploaded to Relive',
        description: `“${result.name}” will be processed into a Relive video shortly.`,
      });
    } else {
      toast({
        title: 'Upload failed',
        description: 'Please reconnect Relive and try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button onClick={handle} disabled={uploading || connecting || done} variant={variant} size={size} className="gap-2">
      {uploading || connecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Upload className="w-4 h-4" />
      )}
      {done ? 'Uploaded ✓' : isConnected ? 'Upload to Relive' : 'Connect Relive to upload'}
    </Button>
  );
}
