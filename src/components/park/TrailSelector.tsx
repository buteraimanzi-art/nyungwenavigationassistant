import type { Trail } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Footprints, Clock, Mountain, ChevronRight, MapPin, TreePine } from 'lucide-react';

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getDifficultyVariant(d: Trail['difficulty']) {
  const map: Record<string, string> = {
    easy: 'bg-forest-canopy/10 text-forest-canopy border-forest-canopy/20',
    moderate: 'bg-trail-marker/10 text-trail-marker border-trail-marker/20',
    difficult: 'bg-wildlife/10 text-wildlife border-wildlife/20',
    expert: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return map[d] || '';
}

interface TrailSelectorProps {
  trails: Trail[];
  selectedTrailId?: string;
  onSelectTrail: (trail: Trail) => void;
}

export function TrailSelector({ trails, selectedTrailId, onSelectTrail }: TrailSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <TreePine className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Choose an Official Trail</h2>
          <p className="text-sm text-muted-foreground">Names and distances now come from your uploaded Nyungwe park map</p>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-340px)]">
        <div className="space-y-3 pr-4">
          {trails.map((trail) => (
            <Card key={trail.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedTrailId === trail.id ? 'bg-primary/5 ring-2 ring-primary' : 'hover:bg-muted/50'}`} onClick={() => onSelectTrail(trail)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate font-semibold">{trail.name}</h3>
                      {trail.path.length > 1 && (
                        <Badge className={getDifficultyVariant(trail.difficulty)} variant="outline">
                          {trail.difficulty}
                        </Badge>
                      )}
                    </div>
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{trail.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Footprints className="h-4 w-4" />
                        <span>{formatDistance(trail.totalDistance)}</span>
                      </div>
                      {trail.estimatedDuration > 0 && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(trail.estimatedDuration)}</span>
                        </div>
                      )}
                      {trail.elevationGain > 0 && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mountain className="h-4 w-4" />
                          <span>{trail.elevationGain}m</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Official map route</Badge>
                      {(trail.attractions.length > 0 || trail.restAreas.length > 0) && (
                        <>
                          <Badge variant="secondary" className="text-xs"><MapPin className="mr-1 h-3 w-3" />{trail.attractions.length} attractions</Badge>
                          <Badge variant="secondary" className="text-xs">{trail.restAreas.length} rest areas</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function CurrentTrailBadge({ trail }: { trail: Trail }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
      <TreePine className="h-4 w-4 text-primary" />
      <span className="max-w-[150px] truncate text-sm font-medium text-primary">{trail.name}</span>
    </div>
  );
}
