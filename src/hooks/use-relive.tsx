import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { reliveClient, type ReliveActivity, type ReliveUser } from '@/lib/relive';

/**
 * Mock Relive auth + data context.
 *
 * In production this would:
 *   1. Redirect to https://www.relive.com/oauth/authorize?client_id=...&scope=activity:read+activity:write
 *   2. Exchange the code via POST /v1/oauth/token through a Lovable Cloud edge function
 *   3. Persist the access_token + refresh_token in Lovable Cloud (per-user)
 *
 * Today: a single click "connects" a fake account and unlocks the feed/upload UI.
 */

interface ReliveContextValue {
  user: ReliveUser | null;
  isConnected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  activities: ReliveActivity[];
  loading: boolean;
  refresh: () => Promise<void>;
  uploading: boolean;
  uploadCurrentHike: (input: { name: string; trailId: string; durationSec: number }) => Promise<ReliveActivity | null>;
}

const ReliveContext = createContext<ReliveContextValue | null>(null);
const STORAGE_KEY = 'relive_demo_user';

export function ReliveProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ReliveUser | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [activities, setActivities] = useState<ReliveActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Restore mock auth state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reliveClient.getUserActivities();
      setActivities(res.activities);
    } finally {
      setLoading(false);
    }
  }, []);

  // Always load curated public feed (works without sign-in for the community view)
  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      // Simulate OAuth round-trip
      await new Promise((r) => setTimeout(r, 700));
      const u = await reliveClient.getUser();
      setUser(u);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      } catch {
        /* ignore */
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const uploadCurrentHike = useCallback<ReliveContextValue['uploadCurrentHike']>(
    async ({ name, trailId, durationSec }) => {
      if (!user) return null;
      setUploading(true);
      try {
        const res = await reliveClient.uploadActivity({
          file: { points: [], startedAt: new Date(Date.now() - durationSec * 1000).toISOString(), endedAt: new Date().toISOString() },
          external_id: `nyungwe_${trailId}_${Date.now()}`,
          name,
          type: 'hike',
        });
        if (res.status !== 'done' || !res.activity_id) return null;
        await refresh();
        return (await reliveClient.getActivity(res.activity_id)) ?? null;
      } finally {
        setUploading(false);
      }
    },
    [user, refresh],
  );

  const value = useMemo<ReliveContextValue>(
    () => ({
      user,
      isConnected: !!user,
      connecting,
      connect,
      disconnect,
      activities,
      loading,
      refresh,
      uploading,
      uploadCurrentHike,
    }),
    [user, connecting, connect, disconnect, activities, loading, refresh, uploading, uploadCurrentHike],
  );

  return <ReliveContext.Provider value={value}>{children}</ReliveContext.Provider>;
}

export function useRelive(): ReliveContextValue {
  const ctx = useContext(ReliveContext);
  if (!ctx) throw new Error('useRelive must be used inside <ReliveProvider>');
  return ctx;
}
