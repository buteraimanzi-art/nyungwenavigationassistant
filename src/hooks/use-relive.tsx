import { useContext } from 'react';
import { ReliveContext, type ReliveContextValue } from '@/hooks/relive-context';

export function useRelive(): ReliveContextValue {
  const context = useContext(ReliveContext);
  if (!context) throw new Error('useRelive must be used inside <ReliveProvider>');
  return context;
}
