import { createContext } from 'react';
import type { ReliveActivity, ReliveUser } from '@/lib/relive';

export interface ReliveContextValue {
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

export const ReliveContext = createContext<ReliveContextValue | null>(null);
