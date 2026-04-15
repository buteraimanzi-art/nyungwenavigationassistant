import { useState } from 'react';
import { MapPin, Navigation, AlertTriangle, Phone, ChevronDown } from 'lucide-react';
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
        <Alert variant="destructive" className="rounded-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">You are outside the park</AlertTitle>
          <AlertDescription className="text-xs">
            Please travel to <strong>{selectedReception.name}</strong> first.
          </AlertDescription>
        </Alert>
      )}

      {/* Reception picker – Komoot style */}
      <Card className="border-komoot-olive/20 bg-komoot-olive/5 rounded-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-komoot-olive flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Start from</p>
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
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
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      isSelected
                        ? 'border-komoot-olive bg-komoot-olive/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground">{r.name}</span>
                      <div className="flex items-center gap-1.5">
                        {isDefault && (
                          <Badge className="text-[10px] px-2 py-0 rounded-full bg-komoot-olive/10 text-komoot-olive border-komoot-olive/20" variant="outline">Nearest</Badge>
                        )}
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-komoot-olive" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                    {dist !== null && (
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        📍 {formatDist(dist)} from you
                      </p>
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
                <a href={`tel:${selectedReception.phone}`} className="inline-flex items-center gap-1 text-xs text-komoot-olive hover:underline font-medium">
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
                <strong className="text-foreground">{formatDist(userDistToReception)}</strong> from you
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route visual – Komoot style */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-komoot-olive bg-card" />
              <div className="w-0.5 h-8 bg-komoot-olive/30" />
              <div className="w-3 h-3 rounded-full bg-komoot-olive" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">From</p>
                <p className="text-sm font-semibold text-foreground">{selectedReception.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">To</p>
                <p className="text-sm font-semibold text-foreground">{trail.name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GO button – Komoot style big green */}
      <Button
        className="w-full gap-2 h-14 text-lg font-bold rounded-xl bg-komoot-olive hover:bg-komoot-olive/90 text-primary-foreground shadow-lg"
        onClick={() => onStartDirections(selectedReception)}
      >
        <Navigation className="w-5 h-5" />
        GO — Start Navigation
      </Button>
    </div>
  );
}
