import { useState } from 'react';
import { MapPin, Navigation, AlertTriangle, Phone, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Trail, UserLocation } from '@/lib/types';
import { RECEPTIONS, Reception, getReceptionForTrail, getDistanceToReception, isNearPark } from '@/lib/receptions';

interface DirectionsPanelProps {
  trail: Trail;
  userLocation: UserLocation | null;
  onStartDirections: (reception: Reception) => void;
  onClose: () => void;
  isActive: boolean;
}

function formatDist(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export function DirectionsPanel({ trail, userLocation, onStartDirections, onClose, isActive }: DirectionsPanelProps) {
  const defaultReception = getReceptionForTrail(trail.id);
  const [selectedReception, setSelectedReception] = useState<Reception>(defaultReception);
  const [showPicker, setShowPicker] = useState(false);

  const userDistToReception = userLocation
    ? getDistanceToReception(userLocation, selectedReception)
    : null;
  const userNearPark = userLocation ? isNearPark(userLocation) : false;

  const handleSelectReception = (reception: Reception) => {
    setSelectedReception(reception);
    setShowPicker(false);
  };

  return (
    <div className="space-y-3">
      {/* Outside park warning */}
      {userLocation && !userNearPark && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>You are outside the park</AlertTitle>
          <AlertDescription>
            Please travel to <strong>{selectedReception.name}</strong> first to check in before starting the trail.
          </AlertDescription>
        </Alert>
      )}

      {/* Reception picker */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Start from:</p>
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="w-full flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                <span className="truncate">{selectedReception.name}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${showPicker ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Reception options */}
          {showPicker && (
            <div className="space-y-2 pt-1">
              {RECEPTIONS.map((r) => {
                const dist = userLocation ? getDistanceToReception(userLocation, r) : null;
                const isDefault = r.id === defaultReception.id;
                const isSelected = r.id === selectedReception.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectReception(r)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-foreground">{r.name}</span>
                      <div className="flex items-center gap-1.5">
                        {isDefault && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Nearest</Badge>
                        )}
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                    {dist !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {formatDist(dist)} from you
                      </p>
                    )}
                    {r.phone && (
                      <p className="text-xs text-muted-foreground mt-0.5">📞 {r.phone}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Collapsed info */}
          {!showPicker && (
            <>
              <p className="text-xs text-muted-foreground">{selectedReception.description}</p>
              {selectedReception.phone && (
                <a href={`tel:${selectedReception.phone}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Phone className="w-3 h-3" /> {selectedReception.phone}
                </a>
              )}
            </>
          )}

          {/* Distance from user */}
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
              <span className="text-muted-foreground truncate max-w-[140px]">{selectedReception.name}</span>
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
          <Button className="flex-1 gap-2" onClick={() => onStartDirections(selectedReception)}>
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
