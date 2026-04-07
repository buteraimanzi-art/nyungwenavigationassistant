import type { Trail, TrailProgress, Attraction, RestArea } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, Mountain, Footprints, Armchair, Droplets, Eye, Bird, Flower2, Tent, Navigation, ChevronRight } from 'lucide-react';

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getDifficultyColor(d: Trail['difficulty']) {
  const map: Record<string, string> = {
    easy: 'bg-forest-canopy/10 text-forest-canopy border-forest-canopy/20',
    moderate: 'bg-trail-marker/10 text-trail-marker border-trail-marker/20',
    difficult: 'bg-wildlife/10 text-wildlife border-wildlife/20',
    expert: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return map[d] || '';
}

function getAttractionIcon(type: Attraction['type']) {
  switch (type) {
    case 'viewpoint':
      return <Eye className="h-4 w-4" />;
    case 'waterfall':
      return <Droplets className="h-4 w-4" />;
    case 'wildlife':
      return <Bird className="h-4 w-4" />;
    case 'flora':
      return <Flower2 className="h-4 w-4" />;
    case 'campsite':
      return <Tent className="h-4 w-4" />;
    default:
      return <MapPin className="h-4 w-4" />;
  }
}

interface Props {
  trail: Trail;
  progress: TrailProgress | null;
  onSelectAttraction?: (a: Attraction) => void;
  onSelectRestArea?: (r: RestArea) => void;
}

export function TrailInfoPanel({ trail, progress, onSelectAttraction, onSelectRestArea }: Props) {
  const stats = [
    {
      icon: <Footprints className="h-5 w-5 text-primary" />,
      value: formatDistance(trail.totalDistance),
      label: 'Distance',
    },
    ...(trail.estimatedDuration > 0
      ? [{ icon: <Clock className="h-5 w-5 text-primary" />, value: formatDuration(trail.estimatedDuration), label: 'Duration' }]
      : []),
    ...(trail.elevationGain > 0
      ? [{ icon: <Mountain className="h-5 w-5 text-primary" />, value: `${trail.elevationGain}m`, label: 'Elevation' }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{trail.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{trail.description}</p>
            </div>
            {trail.path.length > 1 && (
              <Badge className={getDifficultyColor(trail.difficulty)} variant="outline">
                {trail.difficulty}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-center" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
            {stats.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">{item.icon}</div>
                <span className="text-sm font-semibold">{item.value}</span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {trail.attractions.length === 0 && trail.restAreas.length === 0 && (
        <Card className="border-dashed bg-muted/40">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">This view now overlays the official Nyungwe walking-trail linework traced directly from your uploaded PDF map.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {progress && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Navigation className="h-4 w-4 text-primary" />Your Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">Trail Progress</span><span className="font-semibold">{progress.percentComplete}%</span></div>
              <Progress value={progress.percentComplete} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground">Distance Covered</div><div className="text-lg font-semibold text-primary">{formatDistance(progress.distanceCovered)}</div></div>
              <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs text-muted-foreground">Remaining</div><div className="text-lg font-semibold">{formatDistance(progress.distanceRemaining)}</div></div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
              <div><div className="text-xs text-muted-foreground">Est. Time to Finish</div><div className="text-lg font-semibold">{formatDuration(progress.estimatedTimeRemaining)}</div></div>
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="mb-1 text-xs text-muted-foreground">Current Elevation</div>
              <div className="flex items-center gap-2"><Mountain className="h-4 w-4 text-primary" /><span className="text-lg font-semibold">{progress.currentElevation}m</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {progress?.nearestRestArea && (
        <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => onSelectRestArea?.(progress.nearestRestArea!)}>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Armchair className="h-4 w-4 text-water" />Nearest Rest Area</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{progress.nearestRestArea.name}</div>
                <div className="text-sm capitalize text-muted-foreground">{progress.nearestRestArea.type}</div>
                <div className="mt-2 flex flex-wrap gap-1">{progress.nearestRestArea.amenities.slice(0, 3).map((a, i) => <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>)}</div>
              </div>
              <div className="text-right"><div className="text-2xl font-bold text-primary">{formatDistance(progress.distanceToNearestRestArea)}</div><div className="text-xs text-muted-foreground">away</div></div>
            </div>
          </CardContent>
        </Card>
      )}

      {progress?.nearbyAttractions && progress.nearbyAttractions.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Eye className="h-4 w-4 text-viewpoint" />Nearby Attractions</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[200px]">
              <div className="divide-y divide-border">
                {progress.nearbyAttractions.map((att) => (
                  <button key={att.id} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50" onClick={() => onSelectAttraction?.(att)}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-viewpoint/10 text-viewpoint">{getAttractionIcon(att.type)}</div>
                    <div className="min-w-0 flex-1"><div className="truncate font-medium">{att.name}</div><div className="text-xs capitalize text-muted-foreground">{att.type}</div></div>
                    <div className="flex items-center gap-2 text-right"><div><div className="font-semibold text-primary">{formatDistance(att.distance)}</div><div className="text-xs text-muted-foreground">away</div></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {trail.attractions.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Trail Attractions</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {trail.attractions.map((att) => (
                <button key={att.id} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50" onClick={() => onSelectAttraction?.(att)}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-viewpoint/10 text-viewpoint">{getAttractionIcon(att.type)}</div>
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{att.name}</div><div className="text-xs text-muted-foreground">{att.description}</div></div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {trail.restAreas.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Rest Areas</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {trail.restAreas.map((ra) => (
                <button key={ra.id} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50" onClick={() => onSelectRestArea?.(ra)}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-water/10 text-water"><Armchair className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{ra.name}</div><div className="mt-1 flex flex-wrap gap-1">{ra.amenities.map((a, i) => <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>)}</div></div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
