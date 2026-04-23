import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'user';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe FIRST, then read existing session
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setRoles([]);
      } else {
        // Defer DB call so we don't block the auth callback
        setTimeout(() => {
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', nextSession.user.id)
            .then(({ data }) => {
              setRoles((data ?? []).map((row) => row.role as AppRole));
            });
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    roles,
    isAdmin: roles.includes('admin'),
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
