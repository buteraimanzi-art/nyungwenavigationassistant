import { ParkHeader } from '@/components/park/ParkHeader';
import { BackButton } from '@/components/BackButton';
import { EmergencySOS } from '@/components/park/EmergencySOS';
import { useDemoLocation } from '@/hooks/use-location';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import nyungweLogo from '@/assets/nyungwe-logo.webp';

const updates = [
  { date: 'Apr 15, 2026', title: 'Congo–Nile Trail Reopened', body: 'The full 109 km Congo–Nile trail is now open after seasonal maintenance. All checkpoints active.', tag: 'Trail Update' },
  { date: 'Apr 10, 2026', title: 'New Rest Shelters at Uwinka', body: 'Two new sheltered rest areas have been installed along the Igishigishigi and Buhoro trails near Uwinka reception.', tag: 'Infrastructure' },
  { date: 'Apr 5, 2026', title: 'Chimpanzee Tracking Season', body: 'Peak chimpanzee tracking season runs April–June. Book permits early at Gisakura HQ.', tag: 'Wildlife' },
  { date: 'Mar 28, 2026', title: 'Elevation Profile Feature', body: 'Our new elevation chart lets you preview the climb and descent before starting any trail.', tag: 'App Update' },
  { date: 'Mar 20, 2026', title: 'Satellite Map Layer Added', body: 'Switch between street, satellite, and terrain views for better trail planning.', tag: 'App Update' },
  { date: 'Mar 15, 2026', title: 'Emergency SOS Improvements', body: 'The SOS button is now accessible on every page with faster ranger notification.', tag: 'Safety' },
];

export default function Updates() {
  const { location } = useDemoLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ParkHeader />
      <main className="flex-1">
        <div className="bg-komoot-header py-16 text-center">
          <img src={nyungweLogo} alt="Nyungwe National Park" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-4xl font-bold text-komoot-header-foreground mb-3">Park Updates</h1>
          <p className="text-komoot-header-foreground/70 max-w-xl mx-auto">Latest news, trail conditions, and app improvements</p>
        </div>
        <div className="container max-w-3xl mx-auto px-4 py-12 space-y-4">
          <BackButton to="/" label="Back to routes" className="mb-2" />
          {updates.map((u, i) => (
            <Card key={i} className="rounded-xl hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{u.title}</CardTitle>
                  <Badge variant="outline" className="shrink-0 text-xs rounded-full border-komoot-olive/30 text-komoot-olive">{u.tag}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{u.date}</p>
              </CardHeader>
              <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{u.body}</p></CardContent>
            </Card>
          ))}
        </div>
      </main>
      <EmergencySOS userLocation={location} trailId="" trailName="General" />
    </div>
  );
}
