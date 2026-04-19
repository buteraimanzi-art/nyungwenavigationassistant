import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Mountain, Route, MapPin, ExternalLink } from 'lucide-react';
import {
  formatReliveDate,
  formatReliveDistance,
  formatReliveDuration,
  type ReliveActivity,
} from '@/lib/relive';

interface Props {
  activity: ReliveActivity | null;
  trailName?: string;
  onClose: () => void;
}

export function ReliveActivityDetail({ activity, trailName, onClose }: Props) {
  if (!activity) return null;
  return (
    <Dialog open={!!activity} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <ScrollArea className="max-h-[85vh]">
          {activity.poster_url && (
            <div className="aspect-video bg-muted">
              <img
                src={activity.poster_url}
                alt={activity.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-6 space-y-4">
            <DialogHeader className="text-left space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <span>{activity.user?.country} {activity.user?.display_name}</span>
                <span>•</span>
                <span>{formatReliveDate(activity.activity_at)}</span>
                {trailName && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-[10px]">{trailName}</Badge>
                  </>
                )}
              </div>
              <DialogTitle className="text-xl leading-tight">{activity.name}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3">
              <Stat icon={<Route className="w-4 h-4" />} label="Distance" value={formatReliveDistance(activity.distance)} />
              <Stat icon={<Clock className="w-4 h-4" />} label="Moving time" value={formatReliveDuration(activity.moving_time)} />
              <Stat icon={<Mountain className="w-4 h-4" />} label="Elevation gain" value={`${Math.round(activity.elevation_gain)} m`} />
            </div>

            {activity.url && (
              <Button asChild className="w-full gap-2">
                <a href={activity.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Watch full Relive video
                </a>
              </Button>
            )}

            {activity.moments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Moments along the way ({activity.moments.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {activity.moments.map((m, i) => {
                    const photo = m.media.find((md) => md.type === 'image');
                    return (
                      <div key={i} className="space-y-1">
                        {photo && (
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img src={photo.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground text-center">
                          {formatReliveDistance(m.location.distance)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center bg-card">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-sm">{value}</div>
    </div>
  );
}
