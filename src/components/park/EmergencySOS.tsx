import { useState, useEffect } from 'react';
import type { UserLocation, EmergencyAlert } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, MapPin, Heart, CloudRain, Compass, Bug, HelpCircle, CheckCircle, Loader2 } from 'lucide-react';

const issueTypes: Array<{ value: EmergencyAlert['issueType']; label: string; icon: React.ReactNode }> = [
  { value: 'injury', label: 'Injury', icon: <Heart className="w-5 h-5" /> },
  { value: 'lost', label: 'Lost', icon: <Compass className="w-5 h-5" /> },
  { value: 'wildlife', label: 'Wildlife', icon: <Bug className="w-5 h-5" /> },
  { value: 'weather', label: 'Weather', icon: <CloudRain className="w-5 h-5" /> },
  { value: 'medical', label: 'Medical', icon: <Heart className="w-5 h-5" /> },
  { value: 'other', label: 'Other', icon: <HelpCircle className="w-5 h-5" /> },
];

interface Props { userLocation: UserLocation | null; trailId: string; trailName: string; }

export function EmergencySOS({ userLocation, trailId, trailName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [issueType, setIssueType] = useState<EmergencyAlert['issueType']>('other');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isHolding && holdProgress < 100) {
      interval = setInterval(() => {
        setHoldProgress(prev => { const next = prev + 5; if (next >= 100) { setIsOpen(true); return 0; } return next; });
      }, 50);
    } else if (!isHolding) { setHoldProgress(0); }
    return () => clearInterval(interval);
  }, [isHolding, holdProgress]);

  const handleSubmit = async () => {
    if (!userLocation) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setTimeout(() => { setIsOpen(false); setIsSubmitted(false); setIssueType('other'); setDescription(''); }, 3000);
  };

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="relative">
          {isHolding && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${holdProgress * 2.89} 289`} />
            </svg>
          )}
          <button
            onMouseDown={() => setIsHolding(true)} onMouseUp={() => setIsHolding(false)} onMouseLeave={() => setIsHolding(false)}
            onTouchStart={() => setIsHolding(true)} onTouchEnd={() => setIsHolding(false)}
            className={`relative w-20 h-20 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg transition-all duration-200 ${isHolding ? 'scale-110 animate-pulse-emergency' : 'hover:scale-105'} active:scale-95`}>
            <div className="flex flex-col items-center gap-1"><AlertTriangle className="w-8 h-8" /><span className="text-xs font-bold">SOS</span></div>
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">Hold for emergency</p>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-forest-canopy/20 flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-forest-canopy" /></div>
              <DialogTitle className="text-center mb-2">Help is on the way!</DialogTitle>
              <DialogDescription className="text-center">Park rangers have been notified. Stay calm and stay where you are.</DialogDescription>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-destructive" /></div>
                  <div><DialogTitle>Emergency Alert</DialogTitle><DialogDescription>Help us understand your situation</DialogDescription></div>
                </div>
              </DialogHeader>
              {userLocation && (
                <Alert className="bg-muted"><MapPin className="h-4 w-4" /><AlertDescription className="text-xs">Location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)} • Accuracy: {Math.round(userLocation.accuracy)}m</AlertDescription></Alert>
              )}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">What type of emergency?</Label>
                  <RadioGroup value={issueType} onValueChange={(v) => setIssueType(v as EmergencyAlert['issueType'])} className="grid grid-cols-2 gap-2">
                    {issueTypes.map(type => (
                      <div key={type.value}>
                        <RadioGroupItem value={type.value} id={type.value} className="peer sr-only" />
                        <Label htmlFor={type.value} className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-card p-3 cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive/5 transition-colors">
                          <div className="text-muted-foreground">{type.icon}</div>
                          <span className="text-xs font-medium text-center">{type.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-sm font-medium">Additional details</Label>
                  <Textarea id="desc" placeholder="Describe your situation..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter className="flex gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send Alert'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
