import { useState, useMemo } from 'react';
import { ParkHeader } from '@/components/park/ParkHeader';
import { LeafletTrailMap } from '@/components/park/LeafletTrailMap';
import { TrailInfoPanel } from '@/components/park/TrailInfoPanel';
import { TrailSelector, CurrentTrailBadge } from '@/components/park/TrailSelector';
import { DirectionsPanel } from '@/components/park/DirectionsPanel';
import { EmergencySOS } from '@/components/park/EmergencySOS';
import { trails, calculateTrailProgress } from '@/lib/trail-data';
import { useDemoLocation } from '@/hooks/use-location';
import type { Trail, Attraction, RestArea } from '@/lib/types';
import type { Reception } from '@/lib/receptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TreePine, MapPin, Navigation, ArrowLeft, X } from 'lucide-react';
import nyungweHero from '@/assets/nyungwe-hero.jpg';

export default function Index() {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [showTrailSelector, setShowTrailSelector] = useState(true);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [selectedRestArea, setSelectedRestArea] = useState<RestArea | null>(null);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [chosenReception, setChosenReception] = useState<Reception | null>(null);

  const { location: userLocation } = useDemoLocation();

  const trailProgress = useMemo(() => {
    if (!selectedTrail || !userLocation || selectedTrail.path.length < 2) return null;
    return calculateTrailProgress(userLocation, selectedTrail);
  }, [selectedTrail, userLocation]);

  const handleSelectTrail = (trail: Trail) => {
    setSelectedTrail(trail);
    setShowTrailSelector(false);
    setShowDirections(false);
    setChosenReception(null);
  };

  const handleBackToTrails = () => {
    setSelectedTrail(null);
    setShowTrailSelector(true);
    setShowDirections(false);
    setChosenReception(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ParkHeader />

      {showTrailSelector ? (
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-6">
          <div className="relative rounded-2xl overflow-hidden mb-8 border border-border">
            <div className="absolute inset-0">
              <img src={nyungweHero} alt="" className="w-full h-full object-cover opacity-20" />
            </div>
            <div className="relative p-6 md:p-8 bg-gradient-to-r from-background/95 to-background/80">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <TreePine className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Nyungwe National Park</h1>
                  <p className="text-muted-foreground">Trail Tracker &amp; Explorer</p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-2xl leading-relaxed">
                Explore one of Africa's oldest rainforests with the official park map you uploaded.
                Trail names and distances are now matched to that source.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Badge variant="secondary" className="gap-1"><MapPin className="w-3 h-3" />Rwanda, Southwest</Badge>
                <Badge variant="secondary" className="gap-1"><TreePine className="w-3 h-3" />1,019 km² Rainforest</Badge>
                <Badge variant="secondary" className="gap-1"><Navigation className="w-3 h-3" />3 Receptions</Badge>
              </div>
            </div>
          </div>

          <TrailSelector trails={trails} selectedTrailId={selectedTrail?.id} onSelectTrail={handleSelectTrail} />
        </main>
      ) : selectedTrail ? (
        <>
          {/* Desktop */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            <aside className="w-[400px] border-r border-border bg-card overflow-y-auto">
              <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={handleBackToTrails} className="gap-1"><ArrowLeft className="w-4 h-4" />All Trails</Button>
                  {userLocation && <Badge variant="outline" className="gap-1"><div className="w-2 h-2 rounded-full bg-forest-canopy animate-pulse" />GPS Active</Badge>}
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Directions panel */}
                <DirectionsPanel
                  trail={selectedTrail}
                  userLocation={userLocation}
                  isActive={showDirections}
                  onStartDirections={(reception) => { setChosenReception(reception); setShowDirections(true); }}
                  onClose={() => setShowDirections(false)}
                />
                <TrailInfoPanel trail={selectedTrail} progress={trailProgress} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} />
              </div>
            </aside>
            <main className="flex-1 relative">
              <LeafletTrailMap trail={selectedTrail} userLocation={userLocation} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} showDirections={showDirections} chosenReception={chosenReception} />
              {(selectedAttraction || selectedRestArea) && (
                <div className="absolute top-4 left-4 right-4 max-w-sm z-20">
                  <Card className="shadow-lg">
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
              <EmergencySOS userLocation={userLocation} trailId={selectedTrail.id} trailName={selectedTrail.name} />
            </main>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex-1 flex flex-col relative">
            <div className="p-3 border-b border-border bg-card flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleBackToTrails} className="gap-1 -ml-2"><ArrowLeft className="w-4 h-4" /></Button>
              <CurrentTrailBadge trail={selectedTrail} />
              {userLocation && <Badge variant="outline" className="gap-1"><div className="w-2 h-2 rounded-full bg-forest-canopy animate-pulse" />GPS</Badge>}
            </div>
            <div className="flex-1 relative">
              <LeafletTrailMap trail={selectedTrail} userLocation={userLocation} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} showDirections={showDirections} chosenReception={chosenReception} />
            </div>
            <div className={`absolute left-0 right-0 bottom-0 bg-card border-t border-border rounded-t-2xl shadow-lg transition-all duration-300 ${isBottomSheetExpanded ? 'h-[70vh]' : 'h-[220px]'}`}>
              <button className="w-full flex justify-center py-2" onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}>
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
              </button>
              <div className="overflow-y-auto px-4 pb-24" style={{ height: 'calc(100% - 32px)' }}>
                <DirectionsPanel
                  trail={selectedTrail}
                  userLocation={userLocation}
                  isActive={showDirections}
                  onStartDirections={(reception) => { setChosenReception(reception); setShowDirections(true); }}
                  onClose={() => setShowDirections(false)}
                />
                <div className="mt-4">
                  <TrailInfoPanel trail={selectedTrail} progress={trailProgress} onSelectAttraction={setSelectedAttraction} onSelectRestArea={setSelectedRestArea} />
                </div>
              </div>
            </div>
            <EmergencySOS userLocation={userLocation} trailId={selectedTrail.id} trailName={selectedTrail.name} />
          </div>
        </>
      ) : null}
    </div>
  );
}
