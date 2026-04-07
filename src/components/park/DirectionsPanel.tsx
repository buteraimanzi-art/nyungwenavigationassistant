import { MapPin, Navigation, AlertTriangle, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Trail, UserLocation } from '@/lib/types';
import { Reception, getReceptionForTrail, getDistanceToReception, isNearPark } from '@/lib/receptions';

interface DirectionsPanelProps {
  trail: Trail;
  userLocation: UserLocation | null;
  onStartDirections: () => void;
  onClose: () => void;
  isActive: boolean;
}

function formatDist(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export function DirectionsPanel({ trail, userLocation, onStartDirections, onClose, isActive }: DirectionsPanelProps) {
  const reception = getReceptionForTrail(trail.id);
  const userDistToReception = userLocation
    ? getDistanceToReception(userLocation, reception)
    : null;
  const userNearPark = userLocation ? isNearPark(userLocation) : false;

  return (
    <div className="space-y-3">
      {/* Outside park warning */}
      {userLocation && !userNearPark && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>You are outside the park</AlertTitle>
          <AlertDescription>
            Please travel to <strong>{reception.name}</strong> first to check in before starting the trail.
          </AlertDescription>
        </Alert>
      )}

      {/* Reception card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">Start at: {reception.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{reception.description}</p>
              {reception.phone && (
                <a href={`tel:${reception.phone}`} className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline">
                  <Phone className="w-3 h-3" /> {reception.phone}
                </a>
              )}
            </div>
          </div>

          {/* Distance from user to reception */}
          {userDistToReception !== null && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Navigation className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                You are <strong className="text-foreground">{formatDist(userDistToReception)}</strong> from this reception
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <ArrowRight className="w-3 h-3" />
              Route
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-accent-foreground border-2 border-primary" />
              <span className="text-muted-foreground">{reception.name}</span>
            </div>
            <div className="flex-1 border-t-2 border-dashed border-primary/40 mx-1" />
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-foreground font-medium">{trail.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-2">
        {!isActive ? (
          <Button className="flex-1 gap-2" onClick={onStartDirections}>
            <Navigation className="w-4 h-4" />
            Show Directions on Map
          </Button>
        ) : (
          <Button variant="secondary" className="flex-1 gap-2" onClick={onClose}>
            Hide Directions
          </Button>
        )}
      </div>
    </div>
  );
}
