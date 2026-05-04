import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Blocks the app until the signed-in user has accepted Nyungwe National Park's
 * Release, Assumption of Risk and Indemnity Agreement.
 */
export function IndemnityGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const [fullName, setFullName] = useState('');
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setAccepted(null);
      return;
    }
    let active = true;
    supabase
      .from('profiles')
      .select('indemnity_accepted_at, full_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const ok = !!data?.indemnity_accepted_at;
        setAccepted(ok);
        if (ok) {
          try { localStorage.setItem('nyungwe.indemnity.accepted', '1'); } catch { /* ignore */ }
        }
        if (data?.full_name) setFullName(data.full_name);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleAccept = async () => {
    if (!user) return;
    if (!checked || !fullName.trim() || !signature.trim()) {
      toast({
        title: 'Please complete the form',
        description: 'Type your full name, sign, and tick the agreement box.',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        indemnity_accepted_at: new Date().toISOString(),
        indemnity_full_name: fullName.trim(),
        indemnity_signature: signature.trim(),
      })
      .eq('id', user.id);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Thank you', description: 'Agreement signed. Enjoy Nyungwe 🌿' });
    try {
      localStorage.setItem('nyungwe.indemnity.accepted', '1');
      window.dispatchEvent(new Event('nyungwe:indemnity-accepted'));
    } catch { /* ignore */ }
    setAccepted(true);
  };

  if (loading || !user || accepted === null) return <>{children}</>;
  if (accepted) return <>{children}</>;

  return (
    <>
      {children}
      <Dialog open modal>
        <DialogContent
          className="sm:max-w-2xl p-0 gap-0 overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-br from-destructive/10 via-background to-background">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/15 text-destructive p-2">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  Release, Assumption of Risk & Indemnity Agreement
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Nyungwe National Park · Nyungwe Management Company. All visitors must
                  sign before entering the park.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[40vh] px-6 py-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p className="font-semibold text-foreground">PLEASE READ CAREFULLY.</p>
            <p>
              I, the undersigned, acknowledge that I have requested to participate in
              activities and use services provided at Nyungwe National Park in the
              Republic of Rwanda by Nyungwe Management Company.
            </p>
            <p>
              I understand and accept that I am about to engage in activities that pose
              risks of physical injury and/or death, disease or illness, and/or damage
              to or loss of personal property — including contact with wild plants and
              protected animals, remoteness of medical facilities, and travel by foot,
              automobile, bus or other conveyance over rough terrain.
            </p>
            <p>
              In consideration of the right to participate, I PERSONALLY ASSUME, to the
              greatest extent permitted by law, all reasonably related and foreseeable
              risks of all activities and services I participate in or use. I RELEASE
              Nyungwe Management Company from any and all liability, including liability
              arising from its negligence. I will INDEMNIFY and hold Nyungwe Management
              Company harmless from any and all liability, claims and demands of every
              kind, including for personal injury, wrongful death and property damage.
            </p>
            <p>
              I agree that the exclusive venue for any suit or claim shall be the Courts
              of the Republic of Rwanda, and that this Agreement is to be enforced under
              Rwandan law. If any part of this agreement is found invalid, all other
              portions remain fully enforceable.
            </p>
            <p className="text-xs italic">
              Parents or guardians must sign for minors under 18.
            </p>
          </ScrollArea>

          <div className="px-6 py-4 border-t space-y-3 bg-muted/30">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="indemnity-name">Full legal name</Label>
                <Input
                  id="indemnity-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As on your ID"
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="indemnity-sig">Signature (type your name)</Label>
                <Input
                  id="indemnity-sig"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type to sign"
                  maxLength={120}
                  className="font-[cursive] italic"
                />
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
                className="mt-0.5"
              />
              <span className="text-foreground">
                I have read and agree to the Release, Assumption of Risk and Indemnity
                Agreement above, and I accept the Terms & Conditions of using Nyungwe
                Navigator.
              </span>
            </label>
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={submitting || !checked || !fullName.trim() || !signature.trim()}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign & enter the park
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
