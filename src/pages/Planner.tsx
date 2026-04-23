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
import { EMERGENCY_CONTACTS, type Reception } from '@/lib/receptions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Lock, MapPin, Phone, Route, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const DEFAULT_TRAIL = trails.find((trail) => trail.id === 'trail-ndambarare') ?? trails[0];

type MobilePanel = 'route' | 'details' | 'safety';

export default function Planner() {
  const { isAdmin } = useAuth();
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(DEFAULT_TRAIL);
  const [showDirections, setShowDirections] = useState(false);
  const [chosenReception, setChosenReception] = useState<Reception | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [selectedRestArea, setSelectedRestArea] = useState<RestArea | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('route');

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

  const handleSelectTrail = useCallback((trail: Trail) => {
    setSelectedTrail(trail);
    setIsNavigating(false);
    setShowDirections(false);
    setChosenReception(null);
    setSelectedAttraction(null);
    setSelectedRestArea(null);
  }, []);

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

  const activePoint = selectedAttraction ?? selectedRestArea;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ParkHeader />
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[400px] border-r border-border bg-card overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg text-foreground mb-3">Route Planner</h2>
            <Select value={selectedTrail?.id || ''} onValueChange={(id) => {
              const t = trails.find(t => t.id === id);
              if (t) handleSelectTrail(t);
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

      <div className="md:hidden flex flex-1 min-h-0 flex-col bg-background">
        <div className="border-b border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Select value={selectedTrail?.id || ''} onValueChange={(id) => {
                const trail = trails.find((item) => item.id === id);
                if (trail) handleSelectTrail(trail);
              }}>
                <SelectTrigger className="h-11 rounded-xl bg-background">
                  <SelectValue placeholder="Select a trail" />
                </SelectTrigger>
                <SelectContent>
                  {trails.map((trail) => (
                    <SelectItem key={trail.id} value={trail.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {trail.name} — {(trail.totalDistance / 1000).toFixed(1)} km
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {userLocation && (
              <Badge variant="outline" className="h-11 shrink-0 gap-1.5 rounded-xl px-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                GPS
              </Badge>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { id: 'route', label: 'Route', icon: Route, adminOnly: false },
              { id: 'details', label: 'Details', icon: Info, adminOnly: false },
              { id: 'safety', label: 'Safety', icon: ShieldAlert, adminOnly: true },
            ].map((panel) => {
              const Icon = panel.icon;
              const active = mobilePanel === panel.id;
              const locked = panel.adminOnly && !isAdmin;
              return (
                <Button
                  key={panel.id}
                  type="button"
                  variant={active ? 'default' : 'outline'}
                  className="h-10 rounded-xl gap-2"
                  onClick={() => setMobilePanel(panel.id as MobilePanel)}
                  title={locked ? 'Admin access required' : undefined}
                >
                  {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  <span>{panel.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <main className="flex min-h-0 flex-1 flex-col">
          <div className="relative h-[52dvh] min-h-[300px] max-h-[420px] border-b border-border bg-muted">
            {selectedTrail && (
              <LeafletTrailMap
                trail={selectedTrail}
                userLocation={userLocation}
                showDirections={showDirections}
                chosenReception={chosenReception}
                navSteps={navSteps}
                routeGeometry={routeGeometry}
                onSelectAttraction={setSelectedAttraction}
                onSelectRestArea={setSelectedRestArea}
                resizeTrigger={`planner-mobile-${selectedTrail.id}-${mobilePanel}-${isNavigating ? 'nav' : 'idle'}`}
              />
            )}

            {activePoint && (
              <div className="absolute left-3 right-3 top-3 z-20">
                <Card className="border-border/80 shadow-lg">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-sm">{activePoint.name}</CardTitle>
                      <p className="text-xs capitalize text-muted-foreground">{selectedAttraction?.type || selectedRestArea?.type}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setSelectedAttraction(null); setSelectedRestArea(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-muted-foreground">
                    {selectedAttraction?.description || selectedRestArea?.amenities.join(', ')}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
            {selectedTrail && mobilePanel === 'route' && (
              <div className="space-y-4">
                {isNavigating && chosenReception ? (
                  <NavigationPanel trail={selectedTrail} reception={chosenReception} userLocation={userLocation} onStop={handleStopNavigation} />
                ) : (
                  <DirectionsPanel trail={selectedTrail} userLocation={userLocation} isActive={showDirections} onStartDirections={handleStartNavigation} onClose={() => setShowDirections(false)} />
                )}
              </div>
            )}

            {selectedTrail && mobilePanel === 'details' && (
              <div className="space-y-4">
                <TrailInfoPanel trail={selectedTrail} progress={trailProgress} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} />
                <ElevationProfile trail={selectedTrail} />
              </div>
            )}

            {mobilePanel === 'safety' && !isAdmin && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lock className="h-4 w-4 text-primary" /> Admin only
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Safety tools and emergency contact management are restricted to park admins. Ask a park administrator to grant your account the admin role.
                </CardContent>
              </Card>
            )}

            {mobilePanel === 'safety' && isAdmin && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Emergency contacts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {EMERGENCY_CONTACTS.map((contact) => (
                      <a
                        key={contact.label}
                        href={`tel:${contact.number.replace(/\s+/g, '')}`}
                        className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{contact.label}</p>
                          <p className="text-xs text-muted-foreground">{contact.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <Phone className="h-4 w-4" />
                          {contact.number}
                        </div>
                      </a>
                    ))}
                  </CardContent>
                </Card>

                {selectedTrail && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Case study trail</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p><span className="font-semibold text-foreground">Title:</span> Development of Nyungwe digital navigation application</p>
                      <p><span className="font-semibold text-foreground">Case study:</span> Nyungwe National Park</p>
                      <p><span className="font-semibold text-foreground">Sample trail:</span> {selectedTrail.name} — {(selectedTrail.totalDistance / 1000).toFixed(1)} km</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>

        <EmergencySOS userLocation={userLocation} trailId={selectedTrail?.id || ''} trailName={selectedTrail?.name || 'General'} />
      </div>
    </div>
  );
}
