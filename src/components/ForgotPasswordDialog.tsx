import { useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MailCheck, AlertCircle } from 'lucide-react';

interface Props {
  open: boolean;
  defaultEmail?: string;
  onClose: () => void;
}

export function ForgotPasswordDialog({ open, defaultEmail = '', onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    if (!email) return setError('Enter your email.');
    setSubmitting(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setSent(true);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setSent(false);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            Enter the email you signed up with. We'll send a link to set a new password.
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <Alert>
            <MailCheck className="h-4 w-4" />
            <AlertDescription>
              If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).
            </AlertDescription>
          </Alert>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" name="email" type="email" defaultValue={defaultEmail} autoComplete="email" required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
