import { useState, useMemo, useCallback } from 'react';
import { ParkHeader } from '@/components/park/ParkHeader';
import { LeafletTrailMap } from '@/components/park/LeafletTrailMap';
import { TrailInfoPanel } from '@/components/park/TrailInfoPanel';
import { TrailSelector, CurrentTrailBadge } from '@/components/park/TrailSelector';
import { DirectionsPanel } from '@/components/park/DirectionsPanel';
import { NavigationPanel } from '@/components/park/NavigationPanel';
import { ElevationProfile } from '@/components/park/ElevationProfile';
import { VoiceAssistant } from '@/components/park/VoiceAssistant';
import { EmergencySOS } from '@/components/park/EmergencySOS';
import { trails, calculateTrailProgress } from '@/lib/trail-data';
import { useDemoLocation } from '@/hooks/use-location';
import { generateRoute, type NavStep } from '@/lib/navigation';
import type { Trail, Attraction, RestArea } from '@/lib/types';
import type { Reception } from '@/lib/receptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, ArrowLeft, X } from 'lucide-react';
import nyungweHero from '@/assets/nyungwe-hero.jpg';
import nyungweLogo from '@/assets/nyungwe-logo.webp';

export default function Index() {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [showTrailSelector, setShowTrailSelector] = useState(true);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [selectedRestArea, setSelectedRestArea] = useState<RestArea | null>(null);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [chosenReception, setChosenReception] = useState<Reception | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const { location: userLocation, followRoute } = useDemoLocation();

  const navSteps = useMemo(() => {
    if (!isNavigating || !chosenReception || !selectedTrail) return null;
    return generateRoute(chosenReception, selectedTrail.startPoint);
  }, [isNavigating, chosenReception, selectedTrail]);

  const trailProgress = useMemo(() => {
    if (!selectedTrail || !userLocation || selectedTrail.path.length < 2) return null;
    return calculateTrailProgress(userLocation, selectedTrail);
  }, [selectedTrail, userLocation]);

  const handleSelectTrail = (trail: Trail) => {
    setSelectedTrail(trail);
    setShowTrailSelector(false);
    setShowDirections(false);
    setChosenReception(null);
    setIsNavigating(false);
  };

  const handleBackToTrails = () => {
    setSelectedTrail(null);
    setShowTrailSelector(true);
    setShowDirections(false);
    setChosenReception(null);
    setIsNavigating(false);
  };

  const handleStartNavigation = useCallback((reception: Reception) => {
    if (!selectedTrail) return;
    setChosenReception(reception);
    setShowDirections(true);
    setIsNavigating(true);
    const steps = generateRoute(reception, selectedTrail.startPoint);
    followRoute(steps.map(s => s.coordinate));
  }, [selectedTrail, followRoute]);

  const handleStopNavigation = () => {
    setIsNavigating(false);
    setShowDirections(false);
  };

  const sideContent = selectedTrail && (
    <div className="space-y-4">
      {isNavigating && chosenReception ? (
        <NavigationPanel trail={selectedTrail} reception={chosenReception} userLocation={userLocation} onStop={handleStopNavigation} />
      ) : (
        <DirectionsPanel trail={selectedTrail} userLocation={userLocation} isActive={showDirections} onStartDirections={handleStartNavigation} onClose={() => setShowDirections(false)} />
      )}
      <TrailInfoPanel trail={selectedTrail} progress={trailProgress} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ParkHeader />

      {showTrailSelector ? (
        <main className="flex-1 flex flex-col">
          {/* Hero */}
          <div className="relative h-[70vh] min-h-[480px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
              <img src={nyungweHero} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-komoot-header/60 via-komoot-header/30 to-komoot-header/70" />
            </div>
            <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
              <img src={nyungweLogo} alt="Nyungwe National Park" className="w-24 h-24 mx-auto mb-6 object-contain drop-shadow-lg" />
              <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground leading-tight tracking-tight mb-6">
                Explore beyond the map
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 uppercase tracking-[0.2em] text-sm font-medium">
                Where will you explore next?
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-primary-foreground/50 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 px-8 font-semibold"
                  onClick={() => document.getElementById('trails')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Browse Routes
                </Button>
                <Button
                  size="lg"
                  className="rounded-full bg-komoot-olive text-primary-foreground hover:bg-komoot-olive/90 px-8 font-semibold"
                  onClick={() => window.location.href = '/planner'}
                >
                  Plan a Route
                </Button>
              </div>
            </div>
          </div>

          {/* Trail cards */}
          <div id="trails" className="bg-komoot-beige py-12 flex-1">
            <div className="container max-w-5xl mx-auto px-4">
              <div className="mb-8">
                <p className="uppercase tracking-[0.15em] text-xs font-semibold text-muted-foreground mb-2">
                  Choose your tour, download it to your smartphone
                </p>
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-foreground">Ready for your next adventure?</h2>
                  <Badge variant="secondary" className="gap-1"><MapPin className="w-3 h-3" />{trails.length} routes</Badge>
                </div>
              </div>
              <TrailSelector trails={trails} selectedTrailId={selectedTrail?.id} onSelectTrail={handleSelectTrail} />
            </div>
          </div>
          <EmergencySOS userLocation={userLocation} trailId="" trailName="General" />
        </main>
      ) : selectedTrail ? (
        <>
          {/* Desktop planner layout */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            <aside className="w-[400px] border-r border-border bg-card overflow-y-auto">
              <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={handleBackToTrails} className="gap-1 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4" />All Routes
                  </Button>
                  {userLocation && (
                    <Badge variant="outline" className="gap-1 border-komoot-olive text-komoot-olive">
                      <div className="w-2 h-2 rounded-full bg-komoot-olive animate-pulse" />GPS Active
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-4">{sideContent}</div>
            </aside>
            <main className="flex-1 relative flex flex-col">
              <div className="flex-1 relative">
                <LeafletTrailMap trail={selectedTrail} userLocation={userLocation} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} showDirections={showDirections} chosenReception={chosenReception} navSteps={navSteps} />
                {(selectedAttraction || selectedRestArea) && (
                  <div className="absolute top-4 left-4 right-4 max-w-sm z-20">
                    <Card className="shadow-lg border-none">
                      <CardHeader className="pb-2 flex flex-row items-start justify-between">
                        <div><CardTitle className="text-base">{selectedAttraction?.name || selectedRestArea?.name}</CardTitle><p className="text-sm text-muted-foreground capitalize">{selectedAttraction?.type || selectedRestArea?.type}</p></div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedAttraction(null); setSelectedRestArea(null); }}><X className="w-4 h-4" /></Button>
                      </CardHeader>
                      <CardContent>
                        {selectedAttraction && <p className="text-sm text-muted-foreground">{selectedAttraction.description}</p>}
                        {selectedRestArea && <div className="flex flex-wrap gap-1">{selectedRestArea.amenities.map((a, i) => <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>)}</div>}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
              <ElevationProfile trail={selectedTrail} />
              <EmergencySOS userLocation={userLocation} trailId={selectedTrail.id} trailName={selectedTrail.name} />
              <VoiceAssistant trail={selectedTrail} userLocation={userLocation} progress={trailProgress} isNavigating={isNavigating} />
            </main>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex-1 flex flex-col relative">
            <div className="p-3 border-b border-border bg-card flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleBackToTrails} className="gap-1 -ml-2"><ArrowLeft className="w-4 h-4" /></Button>
              <CurrentTrailBadge trail={selectedTrail} />
              {userLocation && <Badge variant="outline" className="gap-1 border-komoot-olive text-komoot-olive"><div className="w-2 h-2 rounded-full bg-komoot-olive animate-pulse" />GPS</Badge>}
            </div>
            <div className="flex-1 relative">
              <LeafletTrailMap trail={selectedTrail} userLocation={userLocation} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} showDirections={showDirections} chosenReception={chosenReception} navSteps={navSteps} />
            </div>
            <ElevationProfile trail={selectedTrail} />
            <div className={`absolute left-0 right-0 bottom-0 bg-card border-t border-border rounded-t-2xl shadow-lg transition-all duration-300 ${isBottomSheetExpanded ? 'h-[70vh]' : 'h-[260px]'}`}>
              <button className="w-full flex justify-center py-2" onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}>
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
              </button>
              <div className="overflow-y-auto px-4 pb-24" style={{ height: 'calc(100% - 32px)' }}>{sideContent}</div>
            </div>
            <EmergencySOS userLocation={userLocation} trailId={selectedTrail.id} trailName={selectedTrail.name} />
            <VoiceAssistant trail={selectedTrail} userLocation={userLocation} progress={trailProgress} isNavigating={isNavigating} />
          </div>
        </>
      ) : null}
    </div>
  );
}
