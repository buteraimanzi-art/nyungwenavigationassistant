import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { reliveClient, type ReliveActivity, type ReliveUser } from '@/lib/relive';
import { ReliveContext, type ReliveContextValue } from '@/hooks/relive-context';

const STORAGE_KEY = 'relive_demo_user';

export function ReliveProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ReliveUser | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [activities, setActivities] = useState<ReliveActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const reliveUser = await reliveClient.getUser();
      setUser(reliveUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reliveUser));
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
          file: {
            points: [],
            startedAt: new Date(Date.now() - durationSec * 1000).toISOString(),
            endedAt: new Date().toISOString(),
          },
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
      isConnected: Boolean(user),
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
