import type { Trail, TrailProgress, Attraction, RestArea } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, Mountain, Footprints, Armchair, TreePine, Droplets, Eye, Bird, Flower2, Tent, Navigation, ChevronRight } from 'lucide-react';

function formatDistance(m: number) { return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`; }
function formatDuration(min: number) { if (min < 60) return `${min} min`; const h = Math.floor(min / 60); const m = min % 60; return m > 0 ? `${h}h ${m}m` : `${h}h`; }

function getDifficultyColor(d: Trail['difficulty']) {
  const map: Record<string, string> = { easy: 'bg-forest-canopy/10 text-forest-canopy border-forest-canopy/20', moderate: 'bg-trail-marker/10 text-trail-marker border-trail-marker/20', difficult: 'bg-wildlife/10 text-wildlife border-wildlife/20', expert: 'bg-destructive/10 text-destructive border-destructive/20' };
  return map[d] || '';
}

function getAttractionIcon(type: Attraction['type']) {
  switch (type) { case 'viewpoint': return <Eye className="w-4 h-4" />; case 'waterfall': return <Droplets className="w-4 h-4" />; case 'wildlife': return <Bird className="w-4 h-4" />; case 'flora': return <Flower2 className="w-4 h-4" />; case 'campsite': return <Tent className="w-4 h-4" />; default: return <MapPin className="w-4 h-4" />; }
}

interface Props { trail: Trail; progress: TrailProgress | null; onSelectAttraction?: (a: Attraction) => void; onSelectRestArea?: (r: RestArea) => void; }

export function TrailInfoPanel({ trail, progress, onSelectAttraction, onSelectRestArea }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div><CardTitle className="text-lg">{trail.name}</CardTitle><p className="text-sm text-muted-foreground mt-1">{trail.description}</p></div>
            <Badge className={getDifficultyColor(trail.difficulty)} variant="outline">{trail.difficulty}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[{ icon: <Footprints className="w-5 h-5 text-primary" />, value: formatDistance(trail.totalDistance), label: 'Distance' },
              { icon: <Clock className="w-5 h-5 text-primary" />, value: formatDuration(trail.estimatedDuration), label: 'Duration' },
              { icon: <Mountain className="w-5 h-5 text-primary" />, value: `${trail.elevationGain}m`, label: 'Elevation' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">{item.icon}</div>
                <span className="text-sm font-semibold">{item.value}</span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {progress && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Navigation className="w-4 h-4 text-primary" />Your Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2"><span className="text-muted-foreground">Trail Progress</span><span className="font-semibold">{progress.percentComplete}%</span></div>
              <Progress value={progress.percentComplete} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3"><div className="text-xs text-muted-foreground">Distance Covered</div><div className="text-lg font-semibold text-primary">{formatDistance(progress.distanceCovered)}</div></div>
              <div className="bg-muted/50 rounded-lg p-3"><div className="text-xs text-muted-foreground">Remaining</div><div className="text-lg font-semibold">{formatDistance(progress.distanceRemaining)}</div></div>
            </div>
            <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3">
              <div><div className="text-xs text-muted-foreground">Est. Time to Finish</div><div className="text-lg font-semibold">{formatDuration(progress.estimatedTimeRemaining)}</div></div>
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Current Elevation</div>
              <div className="flex items-center gap-2"><Mountain className="w-4 h-4 text-primary" /><span className="text-lg font-semibold">{progress.currentElevation}m</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {progress?.nearestRestArea && (
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSelectRestArea?.(progress.nearestRestArea!)}>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Armchair className="w-4 h-4 text-water" />Nearest Rest Area</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{progress.nearestRestArea.name}</div>
                <div className="text-sm text-muted-foreground capitalize">{progress.nearestRestArea.type}</div>
                <div className="flex flex-wrap gap-1 mt-2">{progress.nearestRestArea.amenities.slice(0, 3).map((a, i) => <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>)}</div>
              </div>
              <div className="text-right"><div className="text-2xl font-bold text-primary">{formatDistance(progress.distanceToNearestRestArea)}</div><div className="text-xs text-muted-foreground">away</div></div>
            </div>
          </CardContent>
        </Card>
      )}

      {progress?.nearbyAttractions && progress.nearbyAttractions.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Eye className="w-4 h-4 text-viewpoint" />Nearby Attractions</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[200px]">
              <div className="divide-y divide-border">
                {progress.nearbyAttractions.map(att => (
                  <button key={att.id} className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left" onClick={() => onSelectAttraction?.(att)}>
                    <div className="w-10 h-10 rounded-full bg-viewpoint/10 flex items-center justify-center text-viewpoint">{getAttractionIcon(att.type)}</div>
                    <div className="flex-1 min-w-0"><div className="font-medium truncate">{att.name}</div><div className="text-xs text-muted-foreground capitalize">{att.type}</div></div>
                    <div className="text-right flex items-center gap-2"><div><div className="font-semibold text-primary">{formatDistance(att.distance)}</div><div className="text-xs text-muted-foreground">away</div></div><ChevronRight className="w-4 h-4 text-muted-foreground" /></div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* All Attractions */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Trail Attractions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {trail.attractions.map(att => (
              <button key={att.id} className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left" onClick={() => onSelectAttraction?.(att)}>
                <div className="w-10 h-10 rounded-full bg-viewpoint/10 flex items-center justify-center text-viewpoint">{getAttractionIcon(att.type)}</div>
                <div className="flex-1 min-w-0"><div className="font-medium truncate">{att.name}</div><div className="text-xs text-muted-foreground">{att.description}</div></div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rest Areas */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Rest Areas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {trail.restAreas.map(ra => (
              <button key={ra.id} className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left" onClick={() => onSelectRestArea?.(ra)}>
                <div className="w-10 h-10 rounded-full bg-water/10 flex items-center justify-center text-water"><Armchair className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0"><div className="font-medium truncate">{ra.name}</div><div className="flex flex-wrap gap-1 mt-1">{ra.amenities.map((a, i) => <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>)}</div></div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
