import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import nyungweLogo from '@/assets/nyungwe-logo.webp';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase puts recovery tokens in the URL hash. The client auto-parses
    // them and emits a PASSWORD_RECOVERY event with a temporary session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session && window.location.hash.includes('type=recovery'))) {
        setValidLink(true);
        setReady(true);
      }
    });
    // If the user landed here without a recovery hash, check existing state once.
    setTimeout(() => {
      if (!ready) {
        const hash = window.location.hash;
        if (hash.includes('type=recovery') || hash.includes('access_token')) {
          setValidLink(true);
        }
        setReady(true);
      }
    }, 800);
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password') ?? '');
    const confirm = String(fd.get('confirm') ?? '');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setSubmitting(true);
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setDone(true);
    toast.success('Password updated. You can sign in now.');
    await supabase.auth.signOut();
    setTimeout(() => navigate('/auth', { replace: true }), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center space-y-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={nyungweLogo} alt="Nyungwe" className="w-10 h-10 rounded-full object-cover" />
            <span className="text-lg font-bold">Nyungwe</span>
          </Link>
          <CardTitle className="text-xl">Set a new password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!ready ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !validLink ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid or expired link</AlertTitle>
              <AlertDescription>
                This password reset link is no longer valid. Request a new one from the sign-in page.
              </AlertDescription>
            </Alert>
          ) : done ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Password updated</AlertTitle>
              <AlertDescription>Redirecting you to sign in…</AlertDescription>
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
                <Label htmlFor="password">New password</Label>
                <Input id="password" name="password" type="password" minLength={6} autoComplete="new-password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input id="confirm" name="confirm" type="password" minLength={6} autoComplete="new-password" required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>
          )}
          <div className="text-center">
            <Link to="/auth" className="text-xs text-muted-foreground hover:text-primary">Back to sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
