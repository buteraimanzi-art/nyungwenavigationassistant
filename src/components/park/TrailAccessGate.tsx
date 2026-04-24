import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { Trail } from '@/lib/types';

interface TrailAccessGateProps {
  trail: Trail | null;
  /** Called once user proves they own a valid code for this trail. */
  onUnlocked: () => void;
  /** Called when user cancels the gate. */
  onCancel: () => void;
}

export function TrailAccessGate({ trail, onUnlocked, onCancel }: TrailAccessGateProps) {
  const { user, isAdmin } = useAuth();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Check if user already redeemed this trail (or is admin → free pass)
  useEffect(() => {
    if (!trail || !user) return;
    setVerifying(true);
    setCode('');
    if (isAdmin) {
      setVerifying(false);
      onUnlocked();
      return;
    }
    supabase
      .from('trail_redemptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('trail_id', trail.id)
      .maybeSingle()
      .then(({ data }) => {
        setVerifying(false);
        if (data) onUnlocked();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trail?.id, user?.id, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trail || !user) return;
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return;
    setChecking(true);

    const { data: codeRow, error: codeErr } = await supabase
      .from('trail_access_codes')
      .select('id, trail_id, active')
      .eq('code', cleaned)
      .maybeSingle();

    if (codeErr || !codeRow) {
      setChecking(false);
      toast.error('Invalid access code');
      return;
    }
    if (!codeRow.active) {
      setChecking(false);
      toast.error('This code has been revoked');
      return;
    }
    if (codeRow.trail_id !== trail.id) {
      setChecking(false);
      toast.error('This code is for a different trail');
      return;
    }

    const { error: redErr } = await supabase.from('trail_redemptions').insert({
      user_id: user.id,
      code_id: codeRow.id,
      trail_id: trail.id,
      trail_name: trail.name,
    });
    setChecking(false);
    if (redErr && !redErr.message.includes('duplicate')) {
      toast.error(redErr.message);
      return;
    }
    toast.success(`${trail.name} unlocked`);
    onUnlocked();
  };

  if (!trail) return null;

  // Don't render the dialog while we silently check existing redemption
  if (verifying) {
    return (
      <Dialog open onOpenChange={(o) => !o && onCancel()}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Trail access code
          </DialogTitle>
          <DialogDescription>
            Enter the access code provided by Nyungwe park staff to open <span className="font-medium text-foreground">{trail.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. NDAMBA-7421"
              className="pl-9 tracking-widest font-mono uppercase"
              maxLength={32}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={checking || !code.trim()}>
              {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Unlock trail
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Don't have a code? Ask reception at <a href="tel:+250788317027" className="text-primary hover:underline">+250 788 317 027</a>.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
