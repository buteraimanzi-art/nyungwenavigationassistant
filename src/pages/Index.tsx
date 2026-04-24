import { useState, useMemo, useCallback, useEffect } from 'react';
import { ParkHeader } from '@/components/park/ParkHeader';
import { LeafletTrailMap } from '@/components/park/LeafletTrailMap';
import { TrailInfoPanel } from '@/components/park/TrailInfoPanel';
import { TrailSelector, CurrentTrailBadge } from '@/components/park/TrailSelector';
import { DirectionsPanel } from '@/components/park/DirectionsPanel';
import { NavigationPanel } from '@/components/park/NavigationPanel';
import { ElevationProfile } from '@/components/park/ElevationProfile';
import { VoiceAssistant } from '@/components/park/VoiceAssistant';
import { AudioGuide } from '@/components/park/AudioGuide';
import { EmergencySOS } from '@/components/park/EmergencySOS';
import { GettingThereMap } from '@/components/park/GettingThereMap';
import { ReliveCommunityFeed } from '@/components/park/ReliveCommunityFeed';
import { ReliveUploadButton } from '@/components/park/ReliveUploadButton';
import { TrailAccessGate } from '@/components/park/TrailAccessGate';
import { trails, calculateTrailProgress } from '@/lib/trail-data';
import { useDemoLocation } from '@/hooks/use-location';
import { useRealRoute } from '@/hooks/use-real-route';
import { useLocationBroadcast } from '@/hooks/use-location-broadcast';
import type { Trail, Attraction, RestArea } from '@/lib/types';
import type { Reception } from '@/lib/receptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, ArrowLeft, X, ChevronUp, ChevronDown, Clock, Mountain, Footprints } from 'lucide-react';
import nyungweHero from '@/assets/nyungwe-hero.jpg';
import nyungweLogo from '@/assets/nyungwe-logo.webp';

export default function Index() {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [pendingTrail, setPendingTrail] = useState<Trail | null>(null);
  const [showTrailSelector, setShowTrailSelector] = useState(true);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [selectedRestArea, setSelectedRestArea] = useState<RestArea | null>(null);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [chosenReception, setChosenReception] = useState<Reception | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const { location: userLocation, followRoute } = useDemoLocation();
  useLocationBroadcast(userLocation, selectedTrail);

  const { route: realRoute, loading: routeLoading } = useRealRoute(
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

  const mobileTrailStats = useMemo(() => {
    if (!selectedTrail) return [];

    return [
      {
        key: 'distance',
        icon: Footprints,
        label: selectedTrail.totalDistance < 1000
          ? `${Math.round(selectedTrail.totalDistance)}m`
          : `${(selectedTrail.totalDistance / 1000).toFixed(1)}km`,
      },
      ...(selectedTrail.estimatedDuration > 0
        ? [{
            key: 'duration',
            icon: Clock,
            label: selectedTrail.estimatedDuration < 60
              ? `${selectedTrail.estimatedDuration} min`
              : `${Math.floor(selectedTrail.estimatedDuration / 60)}h${selectedTrail.estimatedDuration % 60 ? ` ${selectedTrail.estimatedDuration % 60}m` : ''}`,
          }]
        : []),
      ...(selectedTrail.elevationGain > 0
        ? [{ key: 'elevation', icon: Mountain, label: `${selectedTrail.elevationGain}m climb` }]
        : []),
    ];
  }, [selectedTrail]);

  const handleSelectTrail = (trail: Trail) => {
    // Gate trail access by code; promotion happens in the gate's onUnlocked.
    setPendingTrail(trail);
  };

  const promoteTrail = (trail: Trail) => {
    setSelectedTrail(trail);
    setShowTrailSelector(false);
    setShowDirections(false);
    setChosenReception(null);
    setIsNavigating(false);
    setPendingTrail(null);
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
  }, [selectedTrail]);

  // When the real route arrives, drive the demo location along its geometry
  useEffect(() => {
    if (isNavigating && routeGeometry && routeGeometry.length > 1) {
      followRoute(routeGeometry);
    }
  }, [isNavigating, routeGeometry, followRoute]);

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
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Powered by Relive</p>
          <h3 className="text-sm font-semibold">Share your hike</h3>
          <p className="text-xs text-muted-foreground mt-1">Auto-generate a video of this trail and share it with the community.</p>
        </div>
        <ReliveUploadButton trail={selectedTrail} variant="default" size="sm" />
      </div>
      <ReliveCommunityFeed trailId={selectedTrail.id} compact title={`Recent ${selectedTrail.name} hikes`} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ParkHeader />

      {showTrailSelector ? (
        <main className="flex-1 flex flex-col">
          {/* Hero — refined, cinematic */}
          <div className="relative h-[70vh] sm:h-[80vh] md:h-[88vh] min-h-[460px] sm:min-h-[520px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
              <img src={nyungweHero} alt="" className="w-full h-full object-cover scale-105 animate-fade-in" />
              <div className="absolute inset-0 gradient-hero" />
              {/* Subtle vignette */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(30_18%_8%/0.5)_100%)]" />
            </div>

            {/* Floating decorative orbs (hidden on tiny screens to reduce repaint cost) */}
            <div className="hidden sm:block absolute top-1/4 left-[10%] w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-float" />
            <div className="hidden sm:block absolute bottom-1/4 right-[10%] w-96 h-96 rounded-full bg-accent/15 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full glass-dark border border-primary-foreground/15 mb-6 sm:mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-glow animate-pulse" />
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary-foreground/85 font-medium">Rwanda · UNESCO Heritage</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground leading-[1.05] tracking-tight mb-4 sm:mb-6 text-balance">
                Explore beyond
                <span className="block bg-gradient-to-r from-accent-glow via-primary-foreground to-accent bg-clip-text text-transparent">
                  the map
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-primary-foreground/85 mb-8 sm:mb-10 max-w-2xl mx-auto text-balance leading-relaxed px-2">
                Curated trails through one of Africa's oldest rainforests. Real GPS, audio guides, and community adventures.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full gradient-primary text-primary-foreground hover:shadow-glow px-8 font-semibold border-0 transition-smooth h-12"
                  onClick={() => document.getElementById('trails')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Browse Routes
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto rounded-full glass-dark border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 font-semibold transition-smooth h-12"
                  onClick={() => window.location.href = '/planner'}
                >
                  Plan a Route
                </Button>
              </div>

              {/* Stat strip */}
              <div className="mt-10 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-6 max-w-xl mx-auto">
                {[
                  { v: '15+', l: 'Trails' },
                  { v: '1,019', l: 'km² Forest' },
                  { v: '13', l: 'Primates' },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-foreground">{s.v}</div>
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary-foreground/60 mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float">
              <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/40 flex items-start justify-center p-1.5">
                <div className="w-1 h-2 rounded-full bg-primary-foreground/70" />
              </div>
            </div>
          </div>

          {/* Getting to Nyungwe */}
          <div id="getting-there" className="gradient-subtle py-12 sm:py-20 border-b border-border/60">
            <div className="container max-w-6xl mx-auto px-4">
              <div className="mb-6 sm:mb-8 max-w-2xl animate-fade-in-up">
                <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">
                  · Plan your trip
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight text-balance">
                  How to get to Nyungwe
                </h2>
                <p className="text-muted-foreground mt-3 leading-relaxed text-sm sm:text-base">
                  Tap a starting city to see the recommended driving route, distance, and travel time to the park entrances.
                </p>
              </div>
              <GettingThereMap />
            </div>
          </div>

          {/* Trail cards */}
          <div id="trails" className="relative bg-komoot-beige py-12 sm:py-20 flex-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="container max-w-6xl mx-auto px-4 relative">
              <div className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-fade-in-up">
                <div className="max-w-2xl">
                  <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">
                    · Curated experiences
                  </p>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight text-balance">
                    Ready for your next adventure?
                  </h2>
                  <p className="text-muted-foreground mt-3 leading-relaxed text-sm sm:text-base">
                    Choose your tour, download it to your smartphone, and head into the canopy.
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 rounded-full self-start md:self-auto shadow-soft">
                  <MapPin className="w-3.5 h-3.5" />{trails.length} routes
                </Badge>
              </div>
              <TrailSelector trails={trails} selectedTrailId={selectedTrail?.id} onSelectTrail={handleSelectTrail} />
            </div>
          </div>

          {/* Community adventures from Relive */}
          <div className="gradient-subtle border-b border-border/60">
            <ReliveCommunityFeed limit={6} />
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
                <LeafletTrailMap trail={selectedTrail} userLocation={userLocation} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} showDirections={showDirections} chosenReception={chosenReception} navSteps={navSteps} routeGeometry={routeGeometry} resizeTrigger={`desktop-${selectedTrail.id}`} />
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
              <AudioGuide trail={selectedTrail} userLocation={userLocation} />
            </main>
          </div>

          {/* Mobile — use fixed viewport height so the map container has a definite size */}
          <div className="md:hidden flex flex-col relative overflow-hidden" style={{ height: 'calc(100dvh - 64px)' }}>
            <div className="p-3 border-b border-border bg-card flex items-center justify-between gap-2 z-30 relative shrink-0">
              <Button variant="ghost" size="sm" onClick={handleBackToTrails} className="gap-1 -ml-2 shrink-0"><ArrowLeft className="w-4 h-4" /></Button>
              <div className="min-w-0 flex-1 flex justify-center"><CurrentTrailBadge trail={selectedTrail} /></div>
              {userLocation && <Badge variant="outline" className="gap-1 border-komoot-olive text-komoot-olive shrink-0 px-2"><div className="w-2 h-2 rounded-full bg-komoot-olive animate-pulse" />GPS</Badge>}
            </div>
            {/* Map fills the entire remaining viewport behind the bottom sheet */}
            <div className="flex-1 relative min-h-[300px]">
              <LeafletTrailMap trail={selectedTrail} userLocation={userLocation} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} showDirections={showDirections} chosenReception={chosenReception} navSteps={navSteps} routeGeometry={routeGeometry} resizeTrigger={`mobile-${selectedTrail.id}-${isBottomSheetExpanded ? 'open' : 'closed'}`} />
            </div>
            <div className={`absolute left-0 right-0 bottom-0 bg-card border-t border-border rounded-t-2xl shadow-2xl transition-all duration-300 z-20 ${isBottomSheetExpanded ? 'h-[78vh]' : 'h-[170px]'}`}>
              <button
                className="w-full flex flex-col items-center gap-1 pt-2 pb-1"
                onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
                aria-label={isBottomSheetExpanded ? 'Collapse details' : 'Expand details'}
              >
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                <div className="flex items-center gap-1 text-xs font-medium text-foreground/80">
                  <span>{isBottomSheetExpanded ? 'Hide details' : 'Show details'}</span>
                  {isBottomSheetExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                </div>
              </button>
              {!isBottomSheetExpanded && (
                <div className="px-4 pb-4 pt-2 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight text-foreground truncate">{selectedTrail.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{selectedTrail.description}</p>
                    </div>
                    {selectedTrail.path.length > 1 && (
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {selectedTrail.difficulty}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mobileTrailStats.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {isBottomSheetExpanded && (
                <div className="overflow-y-auto px-4 pb-32" style={{ height: 'calc(100% - 38px)' }}>
                  <ElevationProfile trail={selectedTrail} />
                  <div className="mt-4">{sideContent}</div>
                </div>
              )}
            </div>
            <EmergencySOS userLocation={userLocation} trailId={selectedTrail.id} trailName={selectedTrail.name} />
            <VoiceAssistant trail={selectedTrail} userLocation={userLocation} progress={trailProgress} isNavigating={isNavigating} />
            <AudioGuide trail={selectedTrail} userLocation={userLocation} />
          </div>
        </>
      ) : null}

      <TrailAccessGate
        trail={pendingTrail}
        onUnlocked={() => pendingTrail && promoteTrail(pendingTrail)}
        onCancel={() => setPendingTrail(null)}
      />
    </div>
  );
}
