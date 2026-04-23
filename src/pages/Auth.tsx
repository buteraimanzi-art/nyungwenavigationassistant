import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import nyungweLogo from '@/assets/nyungwe-logo.webp';

const signInSchema = z.object({
  email: z.string().trim().email({ message: 'Enter a valid email' }).max(255),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(72),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, { message: 'Enter your name' }).max(100),
});

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Check your details');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Welcome back!');
    navigate('/', { replace: true });
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      password: formData.get('password'),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Check your details');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Account created. You can sign in now.');
    setTab('signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center space-y-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={nyungweLogo} alt="Nyungwe" className="w-10 h-10 rounded-full object-cover" />
            <span className="text-lg font-bold">Nyungwe</span>
          </Link>
          <CardTitle className="text-xl">Sign in to continue</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create an account or sign in to use the Nyungwe digital navigation app.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => setTab(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <form className="space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" name="password" type="password" autoComplete="current-password" required />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input id="signup-name" name="fullName" autoComplete="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={6} required />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
                <p className="text-xs text-muted-foreground">
                  By creating an account you accept that you'll only access Safety controls if you've been granted admin rights.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
