import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Map,
  Navigation,
  AlertTriangle,
  Headphones,
  Camera,
  KeyRound,
  Sparkles,
  X,
} from 'lucide-react';
import nyungweLogo from '@/assets/nyungwe-logo.webp';

const STORAGE_KEY = 'nyungwe.onboarding.completed.v1';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: 'Welcome to Nyungwe Navigator',
    description:
      "Hi! Let's take a 1-minute tour of the app so you can plan and enjoy your visit to Nyungwe National Park with confidence.",
  },
  {
    icon: <Map className="h-6 w-6" />,
    title: '1. Pick a trail',
    description:
      'Tap “Choose a trail” to browse all official Nyungwe trails. Each one shows its distance, difficulty and elevation. The map updates to highlight your selected trail loop.',
  },
  {
    icon: <KeyRound className="h-6 w-6" />,
    title: '2. Unlock with an access code',
    description:
      'Some trails require a short access code from park staff at reception. Enter the code once and the trail stays unlocked for your account.',
  },
  {
    icon: <Navigation className="h-6 w-6" />,
    title: '3. Get there & follow the path',
    description:
      'Use “How to get there” to see directions from your location (or Kigali) to the closest reception. Then start the trail — turn-by-turn steps appear on screen.',
  },
  {
    icon: <Headphones className="h-6 w-6" />,
    title: '4. Audio guide & voice assistant',
    description:
      'Tap the headphones to hear an audio guide for the trail you’re on. The voice assistant can answer questions like “how far to the next rest stop?” hands-free.',
  },
  {
    icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
    title: '5. Emergency SOS',
    description:
      'In trouble? The red SOS button instantly shares your live GPS location and trail name with park admins so help can reach you fast.',
  },
  {
    icon: <Camera className="h-6 w-6" />,
    title: '6. Share your hike (Relive)',
    description:
      'After your hike, upload a Relive activity to share photos and your route with the community. You can browse other visitors’ hikes for inspiration.',
  },
  {
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    title: 'You’re all set!',
    description:
      'You can replay this tour anytime from the menu. Have a wonderful time exploring Nyungwe 🌿',
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // ignore (private mode etc.)
    }
  }, []);

  // Allow other parts of the app to re-open the tour.
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener('nyungwe:open-onboarding', handler);
    return () => window.removeEventListener('nyungwe:open-onboarding', handler);
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && finish()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-background p-6 pb-4">
          <button
            onClick={finish}
            aria-label="Close tour"
            className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <img src={nyungweLogo} alt="Nyungwe" className="h-9 w-9 rounded-full" />
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Quick tour · Step {step + 1} of {STEPS.length}
            </div>
          </div>
          <Progress value={progress} className="h-1.5 mb-5" />
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 text-primary p-2 mt-0.5 shrink-0">
              {current.icon}
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-lg leading-snug">{current.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t bg-background">
          <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
            Skip tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={finish}>
                Get started
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Trigger from anywhere (e.g. header button) to re-open the tour. */
export function openOnboardingTour() {
  window.dispatchEvent(new Event('nyungwe:open-onboarding'));
}
