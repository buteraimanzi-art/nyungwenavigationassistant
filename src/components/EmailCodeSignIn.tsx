import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, MailCheck } from 'lucide-react';
import { toast } from 'sonner';

export function EmailCodeSignIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const value = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    if (!value) return setError('Enter your email.');
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: value,
      options: { shouldCreateUser: true },
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEmail(value);
    setStep('code');
    toast.success('Code sent. Check your inbox.');
  };

  const verifyCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const token = String(new FormData(e.currentTarget).get('token') ?? '').trim();
    if (token.length < 6) return setError('Enter the 6-digit code.');
    setSubmitting(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success('Signed in!');
    navigate('/', { replace: true });
  };

  if (step === 'email') {
    return (
      <form className="space-y-4" onSubmit={sendCode}>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="code-email">Email</Label>
          <Input id="code-email" name="email" type="email" autoComplete="email" required />
          <p className="text-xs text-muted-foreground">We'll email you a 6-digit code to sign in. No password needed.</p>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send code
        </Button>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={verifyCode}>
      <Alert>
        <MailCheck className="h-4 w-4" />
        <AlertDescription>Code sent to <strong>{email}</strong>. Check your inbox (and spam).</AlertDescription>
      </Alert>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="otp-token">6-digit code</Label>
        <Input
          id="otp-token"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify & sign in
      </Button>
      <button
        type="button"
        onClick={() => { setStep('email'); setError(null); }}
        className="text-xs text-muted-foreground hover:text-primary w-full text-center"
      >
        Use a different email
      </button>
    </form>
  );
}
