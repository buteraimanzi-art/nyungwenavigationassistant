import type { Trail } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
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

function getDifficultyColor(d: Trail['difficulty']) {
  const map: Record<string, { bg: string; text: string }> = {
    easy: { bg: 'bg-komoot-olive/15', text: 'text-komoot-olive' },
    moderate: { bg: 'bg-accent/15', text: 'text-accent' },
    difficult: { bg: 'bg-wildlife/15', text: 'text-wildlife' },
    expert: { bg: 'bg-destructive/15', text: 'text-destructive' },
  };
  return map[d] || { bg: '', text: '' };
}

interface TrailSelectorProps {
  trails: Trail[];
  selectedTrailId?: string;
  onSelectTrail: (trail: Trail) => void;
}

export function TrailSelector({ trails, selectedTrailId, onSelectTrail }: TrailSelectorProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {trails.map((trail) => {
        const diff = getDifficultyColor(trail.difficulty);
        return (
          <div
            key={trail.id}
            className={`group relative rounded-2xl overflow-hidden bg-card border border-border cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
              selectedTrailId === trail.id ? 'ring-2 ring-komoot-olive shadow-lg' : ''
            }`}
            onClick={() => onSelectTrail(trail)}
          >
            {/* Image placeholder with gradient overlay */}
            <div className="relative h-44 bg-gradient-to-br from-komoot-olive/20 to-komoot-brown/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-komoot-header/50 to-transparent" />
              {/* Difficulty badge – Komoot style floating on image */}
              {trail.path.length > 1 && (
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${diff.bg} ${diff.text} backdrop-blur-sm`}>
                  {trail.difficulty.charAt(0).toUpperCase() + trail.difficulty.slice(1)}
                </div>
              )}
              {/* Trail icon */}
              <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <TreePine className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-bold text-base text-foreground mb-1 group-hover:text-komoot-olive transition-colors">
                {trail.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                {trail.description}
              </p>

              {/* Stats row – Komoot style */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Footprints className="h-3.5 w-3.5" />
                  <span className="font-medium">{formatDistance(trail.totalDistance)}</span>
                </div>
                {trail.estimatedDuration > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDuration(trail.estimatedDuration)}</span>
                  </div>
                )}
                {trail.elevationGain > 0 && (
                  <div className="flex items-center gap-1">
                    <Mountain className="h-3.5 w-3.5" />
                    <span>{trail.elevationGain}m</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {trail.attractions.length > 0 && (
                  <Badge variant="secondary" className="text-[11px] rounded-full px-2.5">
                    <MapPin className="mr-1 h-3 w-3" />{trail.attractions.length} spots
                  </Badge>
                )}
                {trail.restAreas.length > 0 && (
                  <Badge variant="secondary" className="text-[11px] rounded-full px-2.5">
                    {trail.restAreas.length} rest areas
                  </Badge>
                )}
              </div>
            </div>

            {/* Hover arrow */}
            <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-komoot-olive flex items-center justify-center shadow-lg">
                <ChevronRight className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CurrentTrailBadge({ trail }: { trail: Trail }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-komoot-olive/10 px-3 py-1.5 border border-komoot-olive/20">
      <TreePine className="h-4 w-4 text-komoot-olive" />
      <span className="max-w-[150px] truncate text-sm font-medium text-komoot-olive">{trail.name}</span>
    </div>
  );
}
