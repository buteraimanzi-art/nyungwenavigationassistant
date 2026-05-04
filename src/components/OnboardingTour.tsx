import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Map, Navigation, AlertTriangle, KeyRound, Sparkles, X, User, MapPin,
  ArrowRight,
} from 'lucide-react';
import nyungweLogo from '@/assets/nyungwe-logo.webp';

const STORAGE_KEY = 'nyungwe.onboarding.completed.v2';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** CSS selector to spotlight. Empty = centered welcome card. */
  target?: string;
  /** Where to anchor the tooltip relative to the target. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const STEPS: Step[] = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: 'Welcome to Nyungwe Navigator 👋',
    description:
      "Let's take a quick guided tour. We'll highlight every key button so you know exactly where to tap. Tap Next to begin.",
    placement: 'center',
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: 'Plan how to get there',
    description:
      'This panel shows live driving routes from Kigali, Huye and other cities to the park entrances. Tap a city to see distance and travel time.',
    target: '[data-tour="getting-there"]',
    placement: 'top',
  },
  {
    icon: <Map className="h-6 w-6" />,
    title: 'Pick your trail',
    description:
      'Browse all official Nyungwe trails here. Each card shows distance, difficulty and elevation. Tap one to open the map and start exploring.',
    target: '[data-tour="trails"]',
    placement: 'top',
  },
  {
    icon: <KeyRound className="h-6 w-6" />,
    title: 'Unlock with an access code',
    description:
      'Some trails need a single-use code from park reception. Enter it once and the trail unlocks for your account.',
    target: '[data-tour="trails"]',
    placement: 'top',
  },
  {
    icon: <Navigation className="h-6 w-6" />,
    title: 'Navigate hands-free',
    description:
      "Once on a trail you'll see turn-by-turn directions, an audio guide, a voice assistant, and live GPS — all from inside the trail screen.",
    target: '[data-tour="trails"]',
    placement: 'top',
  },
  {
    icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
    title: 'Emergency SOS',
    description:
      'See this red SOS button? In trouble, tap it — your live GPS and trail name are sent instantly to park admins.',
    target: '[data-tour="sos"]',
    placement: 'left',
  },
  {
    icon: <User className="h-6 w-6" />,
    title: 'Your account & menu',
    description:
      "Open this menu anytime to view your trails, sign out, or replay this tutorial. That's everything — enjoy your visit 🌿",
    target: '[data-tour="account-menu"]',
    placement: 'bottom',
  },
];

interface Rect { top: number; left: number; width: number; height: number; }

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tryOpen = () => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return;
        // Wait until the indemnity has been signed so we don't cover its dialog
        if (localStorage.getItem('nyungwe.indemnity.accepted') !== '1') return;
        if (cancelled) return;
        setOpen(true);
      } catch { /* ignore */ }
    };
    const t = setTimeout(tryOpen, 800);
    window.addEventListener('nyungwe:indemnity-accepted', tryOpen);
    return () => {
      cancelled = true;
      clearTimeout(t);
      window.removeEventListener('nyungwe:indemnity-accepted', tryOpen);
    };
  }, []);

  useEffect(() => {
    const handler = () => { setStep(0); setOpen(true); };
    window.addEventListener('nyungwe:open-onboarding', handler);
    return () => window.removeEventListener('nyungwe:open-onboarding', handler);
  }, []);

  // Compute spotlight rect for current step
  useLayoutEffect(() => {
    if (!open) return;
    const current = STEPS[step];
    if (!current?.target) { setRect(null); return; }

    const measure = () => {
      const el = document.querySelector(current.target!) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // wait a frame for scroll to settle, then measure
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      });
    };
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    const interval = setInterval(measure, 400); // keep in sync during animations
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      clearInterval(interval);
    };
  }, [open, step]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  // Tooltip positioning
  const PADDING = 12;
  const TOOLTIP_W = 360;
  const tooltipStyle: React.CSSProperties = (() => {
    if (!rect || current.placement === 'center' || !current.target) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const placement = current.placement ?? 'bottom';
    let top = 0;
    let left = 0;
    if (placement === 'top') {
      top = rect.top - PADDING - 220;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    } else if (placement === 'bottom') {
      top = rect.top + rect.height + PADDING;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    } else if (placement === 'left') {
      top = rect.top + rect.height / 2 - 110;
      left = rect.left - TOOLTIP_W - PADDING;
    } else {
      top = rect.top + rect.height / 2 - 110;
      left = rect.left + rect.width + PADDING;
    }
    // clamp inside viewport
    left = Math.max(12, Math.min(left, vw - TOOLTIP_W - 12));
    top = Math.max(12, Math.min(top, vh - 240));
    return { top, left, width: TOOLTIP_W };
  })();

  // Spotlight rect (with padding) for the SVG mask
  const spot = rect
    ? {
        x: Math.max(0, rect.left - 8),
        y: Math.max(0, rect.top - 8),
        w: rect.width + 16,
        h: rect.height + 16,
      }
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      {/* Spotlight overlay using SVG mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="onboarding-mask">
            <rect width="100%" height="100%" fill="white" />
            {spot && (
              <rect
                x={spot.x}
                y={spot.y}
                width={spot.w}
                height={spot.h}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(10, 15, 20, 0.72)"
          mask="url(#onboarding-mask)"
          onClick={() => { /* swallow */ }}
        />
        {spot && (
          <rect
            x={spot.x}
            y={spot.y}
            width={spot.w}
            height={spot.h}
            rx="14"
            ry="14"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            className="animate-pulse"
            style={{ filter: 'drop-shadow(0 0 14px hsl(var(--primary) / 0.7))' }}
          />
        )}
      </svg>

      {/* Animated pointer arrow toward target */}
      {spot && current.placement && current.placement !== 'center' && (
        <div
          className="absolute text-primary animate-bounce pointer-events-none"
          style={{
            top:
              current.placement === 'top'
                ? spot.y - 36
                : current.placement === 'bottom'
                ? spot.y + spot.h + 6
                : spot.y + spot.h / 2 - 12,
            left:
              current.placement === 'left'
                ? spot.x - 36
                : current.placement === 'right'
                ? spot.x + spot.w + 6
                : spot.x + spot.w / 2 - 12,
            transform:
              current.placement === 'top'
                ? 'rotate(90deg)'
                : current.placement === 'bottom'
                ? 'rotate(-90deg)'
                : current.placement === 'left'
                ? 'rotate(0deg)'
                : 'rotate(180deg)',
          }}
        >
          <ArrowRight className="h-7 w-7 drop-shadow-lg" />
        </div>
      )}

      {/* Tooltip card */}
      <div
        className="absolute rounded-xl bg-background border-2 border-primary/40 shadow-2xl overflow-hidden animate-fade-in"
        style={tooltipStyle}
      >
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-5 pb-4">
          <button
            onClick={finish}
            aria-label="Close tour"
            className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <img src={nyungweLogo} alt="" className="h-7 w-7 rounded-full" />
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Tutorial · Step {step + 1} of {STEPS.length}
            </div>
          </div>
          <Progress value={progress} className="h-1.5 mb-4" />
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 text-primary p-2 mt-0.5 shrink-0">
              {current.icon}
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="font-semibold text-base leading-snug">{current.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t bg-background">
          <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={finish}>Get started</Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Trigger from anywhere (e.g. header button) to re-open the tour. */
export function openOnboardingTour() {
  try { localStorage.removeItem('nyungwe.onboarding.completed.v2'); } catch { /* ignore */ }
  window.dispatchEvent(new Event('nyungwe:open-onboarding'));
}
