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
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <TreePine className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Choose a Trail</h2>
          <p className="text-sm text-muted-foreground">Select a trail to start your adventure</p>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-340px)]">
        <div className="space-y-3 pr-4">
          {trails.map(trail => (
            <Card key={trail.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedTrailId === trail.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={() => onSelectTrail(trail)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{trail.name}</h3>
                      <Badge className={getDifficultyVariant(trail.difficulty)} variant="outline">{trail.difficulty}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{trail.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground"><Footprints className="w-4 h-4" /><span>{formatDistance(trail.totalDistance)}</span></div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-4 h-4" /><span>{formatDuration(trail.estimatedDuration)}</span></div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><Mountain className="w-4 h-4" /><span>{trail.elevationGain}m</span></div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs"><MapPin className="w-3 h-3 mr-1" />{trail.attractions.length} attractions</Badge>
                      <Badge variant="secondary" className="text-xs">{trail.restAreas.length} rest areas</Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
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
    <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
      <TreePine className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium text-primary truncate max-w-[150px]">{trail.name}</span>
    </div>
  );
}
