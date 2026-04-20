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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {trails.map((trail, idx) => {
        const diff = getDifficultyColor(trail.difficulty);
        return (
          <div
            key={trail.id}
            className={`group relative rounded-2xl overflow-hidden gradient-card border border-border cursor-pointer transition-spring hover-lift animate-fade-in-up ${
              selectedTrailId === trail.id ? 'ring-2 ring-primary shadow-elegant' : 'shadow-soft'
            }`}
            style={{ animationDelay: `${Math.min(idx * 60, 480)}ms` }}
            onClick={() => onSelectTrail(trail)}
          >
            {/* Image header with gradient + decorative blob */}
            <div className="relative h-48 bg-gradient-to-br from-forest-canopy via-primary to-forest-deep overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent/30 blur-2xl group-hover:bg-accent/40 transition-smooth" />
              <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-primary/40 blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 via-transparent to-transparent" />

              {/* Difficulty badge */}
              {trail.path.length > 1 && (
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider glass shadow-soft ${diff.text}`}>
                  {trail.difficulty}
                </div>
              )}

              {/* Trail icon — floating */}
              <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full glass-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-spring">
                <TreePine className="w-5 h-5 text-primary-foreground" />
              </div>

              {/* Distance pill — bottom left */}
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-primary-foreground">
                <Footprints className="w-3.5 h-3.5" />
                <span className="font-bold text-sm">{formatDistance(trail.totalDistance)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-smooth tracking-tight">
                {trail.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                {trail.description}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b border-border/60">
                {trail.estimatedDuration > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary/70" />
                    <span className="font-medium">{formatDuration(trail.estimatedDuration)}</span>
                  </div>
                )}
                {trail.elevationGain > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Mountain className="h-3.5 w-3.5 text-primary/70" />
                    <span className="font-medium">{trail.elevationGain}m</span>
                  </div>
                )}
              </div>

              {/* Tags + arrow */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {trail.attractions.length > 0 && (
                    <Badge variant="secondary" className="text-[11px] rounded-full px-2.5 font-medium">
                      <MapPin className="mr-1 h-3 w-3" />{trail.attractions.length} spots
                    </Badge>
                  )}
                  {trail.restAreas.length > 0 && (
                    <Badge variant="secondary" className="text-[11px] rounded-full px-2.5 font-medium">
                      {trail.restAreas.length} rest
                    </Badge>
                  )}
                </div>
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shadow-soft group-hover:shadow-glow group-hover:scale-110 transition-spring shrink-0">
                  <ChevronRight className="w-4 h-4 text-primary-foreground" />
                </div>
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
    <div className="flex items-center gap-2 rounded-full gradient-primary px-3 py-1.5 shadow-soft">
      <TreePine className="h-4 w-4 text-primary-foreground" />
      <span className="max-w-[150px] truncate text-sm font-medium text-primary-foreground">{trail.name}</span>
    </div>
  );
}
