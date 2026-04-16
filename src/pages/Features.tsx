import { ParkHeader } from '@/components/park/ParkHeader';
import { EmergencySOS } from '@/components/park/EmergencySOS';
import { useDemoLocation } from '@/hooks/use-location';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation, Map, Mountain, Mic, AlertTriangle, Layers, MapPin, Compass } from 'lucide-react';
import nyungweLogo from '@/assets/nyungwe-logo.webp';

const features = [
  { icon: <Navigation className="w-8 h-8" />, title: 'Turn-by-Turn Navigation', desc: 'Get real-time directions from any reception to your chosen trailhead with Komoot-style step-by-step guidance.' },
  { icon: <Map className="w-8 h-8" />, title: 'Interactive Trail Map', desc: 'Explore all 18 official Nyungwe trails on a detailed Leaflet map with GPS tracking and trail overlays.' },
  { icon: <Mountain className="w-8 h-8" />, title: 'Elevation Profile', desc: 'See the climb and descent of every trail with a visual elevation chart before you start hiking.' },
  { icon: <Mic className="w-8 h-8" />, title: 'Voice Assistant', desc: 'Hands-free trail guidance — ask about nearby rest areas, attractions, and get spoken directions.' },
  { icon: <AlertTriangle className="w-8 h-8" />, title: 'Emergency SOS', desc: 'One-touch emergency alert with GPS coordinates sent to park rangers when you need help.' },
  { icon: <Layers className="w-8 h-8" />, title: 'Satellite & Terrain View', desc: 'Toggle between street, satellite, and terrain map layers for better trail visibility.' },
  { icon: <MapPin className="w-8 h-8" />, title: 'Rest Areas & Attractions', desc: 'Find nearby shelters, benches, viewpoints, waterfalls, and wildlife spotting areas along every trail.' },
  { icon: <Compass className="w-8 h-8" />, title: 'Choose Your Reception', desc: 'Pick from 3 park entrances — Gisakura HQ, Uwinka, or Gisovu — to start your journey.' },
];

export default function Features() {
  const { location } = useDemoLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ParkHeader />
      <main className="flex-1">
        <div className="bg-komoot-header py-16 text-center">
          <img src={nyungweLogo} alt="Nyungwe National Park" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-4xl font-bold text-komoot-header-foreground mb-3">Features</h1>
          <p className="text-komoot-header-foreground/70 max-w-xl mx-auto">Everything you need for a safe, guided adventure through Nyungwe National Park</p>
        </div>
        <div className="container max-w-5xl mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Card key={i} className="rounded-xl hover:shadow-lg transition-shadow border-komoot-olive/10 hover:border-komoot-olive/30">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-komoot-olive/10 text-komoot-olive flex items-center justify-center mx-auto mb-4">{f.icon}</div>
                  <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <EmergencySOS userLocation={location} trailId="" trailName="General" />
    </div>
  );
}
