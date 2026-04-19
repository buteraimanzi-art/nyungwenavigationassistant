import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Mountain, Route, ExternalLink, Camera, Play } from 'lucide-react';
import {
  formatReliveDate,
  formatReliveDistance,
  formatReliveDuration,
  type ReliveActivity,
} from '@/lib/relive';

interface Props {
  activity: ReliveActivity;
  trailName?: string;
  onSelect?: (a: ReliveActivity) => void;
}

export function ReliveActivityCard({ activity, trailName, onSelect }: Props) {
  const poster = activity.poster_url || activity.poster_square_url || activity.moments[0]?.media[0]?.url;
  const photoCount = activity.moments.reduce((acc, m) => acc + m.media.filter((md) => md.type === 'image').length, 0);

  return (
    <Card className="overflow-hidden border-border hover:shadow-lg transition-shadow group">
      <button
        type="button"
        onClick={() => onSelect?.(activity)}
        className="relative w-full aspect-video overflow-hidden block"
      >
        {poster ? (
          <img
            src={poster}
            alt={activity.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
            <Route className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-background/90 text-foreground hover:bg-background/90 border-0 backdrop-blur">
            <Play className="w-3 h-3 mr-1" />
            Relive
          </Badge>
          {trailName && (
            <Badge variant="outline" className="bg-background/80 text-foreground border-0 backdrop-blur">
              {trailName}
            </Badge>
          )}
        </div>
        {photoCount > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-foreground/60 text-primary-foreground text-xs backdrop-blur">
            <Camera className="w-3 h-3" />
            {photoCount}
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 text-primary-foreground">
          <p className="text-xs uppercase tracking-wider opacity-90 mb-1">
            {activity.user?.country} {activity.user?.display_name} • {formatReliveDate(activity.activity_at)}
          </p>
          <h3 className="font-semibold text-base line-clamp-2 leading-snug">{activity.name}</h3>
        </div>
      </button>
      <CardContent className="p-3">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-0.5">
              <Route className="w-3 h-3" />
              Distance
            </div>
            <div className="font-semibold">{formatReliveDistance(activity.distance)}</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-0.5">
              <Clock className="w-3 h-3" />
              Duration
            </div>
            <div className="font-semibold">{formatReliveDuration(activity.moving_time)}</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-0.5">
              <Mountain className="w-3 h-3" />
              Elev. gain
            </div>
            <div className="font-semibold">{Math.round(activity.elevation_gain)} m</div>
          </div>
        </div>
        {activity.url && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full mt-3 gap-2"
          >
            <a href={activity.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
              Watch on Relive
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
