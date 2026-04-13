import { useMemo } from 'react';
import { Navigation, X, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Trail, UserLocation } from '@/lib/types';
import type { Reception } from '@/lib/receptions';
import { generateRoute, findCurrentStep, getDirectionIcon, type NavStep } from '@/lib/navigation';

interface NavigationPanelProps {
  trail: Trail;
  reception: Reception;
  userLocation: UserLocation | null;
  onStop: () => void;
}

function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function NavigationPanel({ trail, reception, userLocation, onStop }: NavigationPanelProps) {
  const steps = useMemo(() => generateRoute(reception, trail.startPoint), [reception, trail]);

  const currentStepIdx = useMemo(() => {
    if (!userLocation) return 0;
    return findCurrentStep(userLocation, steps);
  }, [userLocation, steps]);

  const currentStep = steps[currentStepIdx];
  const nextStep = currentStepIdx < steps.length - 1 ? steps[currentStepIdx + 1] : null;
  const totalDist = steps[steps.length - 1]?.cumulativeDistance || 0;
  const progress = totalDist > 0 ? Math.round((currentStep.cumulativeDistance / totalDist) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Main direction card – Komoot-style big instruction */}
      <Card className="border-primary bg-primary/5 overflow-hidden">
        <div className="bg-primary px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Navigation className="w-4 h-4" />
            <span className="text-sm font-semibold">Navigation Active</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" onClick={onStop}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardContent className="p-0">
          {/* Big current instruction */}
          <div className="px-5 py-6 flex items-center gap-4">
            <div className="text-5xl shrink-0">{getDirectionIcon(currentStep.direction)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-foreground leading-tight">{currentStep.instruction}</p>
              {nextStep && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <span>Then:</span>
                  <span>{getDirectionIcon(nextStep.direction)}</span>
                  <span className="truncate">{nextStep.instruction}</span>
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-5 pb-4 space-y-1.5">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatDist(currentStep.cumulativeDistance)} covered</span>
              <span>{formatDist(totalDist - currentStep.cumulativeDistance)} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route info */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3" />
            <span>{reception.name}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium text-foreground">{trail.name}</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">{formatDist(totalDist)} total</Badge>
            <Badge variant="secondary" className="text-xs">{steps.length} steps</Badge>
            <Badge variant="outline" className="text-xs">Step {currentStepIdx + 1}/{steps.length}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Step list */}
      <Card>
        <CardContent className="p-0 max-h-[200px] overflow-y-auto">
          {steps.map((step, i) => (
            <StepRow key={step.id} step={step} isCurrent={i === currentStepIdx} isPast={i < currentStepIdx} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StepRow({ step, isCurrent, isPast }: { step: NavStep; isCurrent: boolean; isPast: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 transition-colors ${
      isCurrent ? 'bg-primary/10' : isPast ? 'opacity-50' : ''
    }`}>
      <span className="text-xl shrink-0">{getDirectionIcon(step.direction)}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
          {step.instruction}
        </p>
      </div>
      {step.distanceFromPrev > 0 && (
        <span className="text-xs text-muted-foreground shrink-0">{formatDist(step.distanceFromPrev)}</span>
      )}
    </div>
  );
}
