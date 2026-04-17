import { useState, useMemo, useCallback, useEffect } from 'react';
import { ParkHeader } from '@/components/park/ParkHeader';
import { EmergencySOS } from '@/components/park/EmergencySOS';
import { LeafletTrailMap } from '@/components/park/LeafletTrailMap';
import { DirectionsPanel } from '@/components/park/DirectionsPanel';
import { NavigationPanel } from '@/components/park/NavigationPanel';
import { ElevationProfile } from '@/components/park/ElevationProfile';
import { TrailInfoPanel } from '@/components/park/TrailInfoPanel';
import { trails, calculateTrailProgress } from '@/lib/trail-data';
import { useDemoLocation } from '@/hooks/use-location';
import { useRealRoute } from '@/hooks/use-real-route';
import type { Trail, Attraction, RestArea } from '@/lib/types';
import type { Reception } from '@/lib/receptions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin } from 'lucide-react';

export default function Planner() {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [chosenReception, setChosenReception] = useState<Reception | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [selectedRestArea, setSelectedRestArea] = useState<RestArea | null>(null);

  const { location: userLocation, followRoute } = useDemoLocation();

  const { route: realRoute } = useRealRoute(
    isNavigating,
    chosenReception,
    selectedTrail?.startPoint ?? null,
  );
  const navSteps = realRoute?.steps ?? null;
  const routeGeometry = realRoute?.geometry ?? null;

  const trailProgress = useMemo(() => {
    if (!selectedTrail || !userLocation || selectedTrail.path.length < 2) return null;
    return calculateTrailProgress(userLocation, selectedTrail);
  }, [selectedTrail, userLocation]);

  const handleStartNavigation = useCallback((reception: Reception) => {
    if (!selectedTrail) return;
    setChosenReception(reception);
    setIsNavigating(true);
    setShowDirections(true);
  }, [selectedTrail]);

  useEffect(() => {
    if (isNavigating && routeGeometry && routeGeometry.length > 1) {
      followRoute(routeGeometry);
    }
  }, [isNavigating, routeGeometry, followRoute]);

  const handleStopNavigation = () => {
    setIsNavigating(false);
    setShowDirections(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ParkHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[400px] border-r border-border bg-card overflow-y-auto hidden md:block">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg text-foreground mb-3">Route Planner</h2>
            <Select value={selectedTrail?.id || ''} onValueChange={(id) => {
              const t = trails.find(t => t.id === id);
              if (t) { setSelectedTrail(t); setIsNavigating(false); setShowDirections(false); setChosenReception(null); }
            }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a trail..." />
              </SelectTrigger>
              <SelectContent>
                {trails.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {t.name} — {(t.totalDistance / 1000).toFixed(1)} km
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTrail && (
            <div className="p-4 space-y-4">
              {isNavigating && chosenReception ? (
                <NavigationPanel trail={selectedTrail} reception={chosenReception} userLocation={userLocation} onStop={handleStopNavigation} />
              ) : (
                <DirectionsPanel trail={selectedTrail} userLocation={userLocation} isActive={showDirections} onStartDirections={handleStartNavigation} onClose={() => setShowDirections(false)} />
              )}
              <TrailInfoPanel trail={selectedTrail} progress={trailProgress} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} />
            </div>
          )}

          {!selectedTrail && (
            <div className="p-8 text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a trail above to start planning your route</p>
            </div>
          )}
        </aside>

        {/* Map area */}
        <main className="flex-1 flex flex-col relative">
          {selectedTrail ? (
            <>
              <div className="flex-1">
                <LeafletTrailMap trail={selectedTrail} userLocation={userLocation} showDirections={showDirections} chosenReception={chosenReception} navSteps={navSteps} routeGeometry={routeGeometry} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} />
              </div>
              <ElevationProfile trail={selectedTrail} />
            </>
          ) : (
            <div className="flex-1">
              <LeafletTrailMap trail={trails[0]} userLocation={userLocation} />
            </div>
          )}
          <EmergencySOS userLocation={userLocation} trailId={selectedTrail?.id || ''} trailName={selectedTrail?.name || 'General'} />
        </main>
      </div>
    </div>
  );
}
