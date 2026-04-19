import { useMemo, useState } from 'react';
import { useRelive } from '@/hooks/use-relive';
import { ReliveActivityCard } from './ReliveActivityCard';
import { ReliveActivityDetail } from './ReliveActivityDetail';
import { ReliveConnectButton } from './ReliveConnectButton';
import { trails } from '@/lib/trail-data';
import type { ReliveActivity } from '@/lib/relive';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Filter } from 'lucide-react';

interface Props {
  /** When set, only show activities for this trail. */
  trailId?: string;
  /** Optional title override. */
  title?: string;
  /** Limit shown items (e.g. 3 on a trail page). */
  limit?: number;
  compact?: boolean;
}

export function ReliveCommunityFeed({ trailId, title, limit, compact }: Props) {
  const { activities, loading } = useRelive();
  const [filter, setFilter] = useState<string | 'all'>(trailId ?? 'all');
  const [selected, setSelected] = useState<ReliveActivity | null>(null);

  const trailMap = useMemo(() => new Map(trails.map((t) => [t.id, t.name])), []);

  const filtered = useMemo(() => {
    let list = activities;
    if (trailId) list = list.filter((a) => a.trail_id === trailId);
    else if (filter !== 'all') list = list.filter((a) => a.trail_id === filter);
    if (limit) list = list.slice(0, limit);
    return list;
  }, [activities, trailId, filter, limit]);

  const trailsInFeed = useMemo(() => {
    const ids = Array.from(new Set(activities.map((a) => a.trail_id).filter(Boolean) as string[]));
    return ids.map((id) => ({ id, name: trailMap.get(id) ?? id }));
  }, [activities, trailMap]);

  return (
    <section className={compact ? '' : 'py-12'}>
      <div className={compact ? '' : 'container max-w-6xl mx-auto px-4'}>
        {!compact && (
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <p className="uppercase tracking-[0.15em] text-xs font-semibold text-muted-foreground mb-2">
                Powered by Relive
              </p>
              <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Users className="w-7 h-7 text-primary" />
                {title ?? 'Recent adventures in Nyungwe'}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Real GPS tracks, photos and videos from the Relive community. Tap a card to explore moments along the trail.
              </p>
            </div>
            <ReliveConnectButton />
          </div>
        )}

        {!trailId && !compact && trailsInFeed.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Badge
              variant={filter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('all')}
            >
              All trails
            </Badge>
            {trailsInFeed.map((t) => (
              <Badge
                key={t.id}
                variant={filter === t.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter(t.id)}
              >
                {t.name}
              </Badge>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading community activities…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            No Relive activities yet for this trail.
            <div className="mt-3">
              <ReliveConnectButton />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a) => (
              <ReliveActivityCard
                key={a.id}
                activity={a}
                trailName={a.trail_id ? trailMap.get(a.trail_id) : undefined}
                onSelect={setSelected}
              />
            ))}
          </div>
        )}

        {limit && activities.length > limit && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => setFilter('all')}>
              See more adventures
            </Button>
          </div>
        )}
      </div>

      <ReliveActivityDetail
        activity={selected}
        trailName={selected?.trail_id ? trailMap.get(selected.trail_id) : undefined}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
