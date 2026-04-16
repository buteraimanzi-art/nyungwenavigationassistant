import { useMemo } from 'react';
import type { Trail } from '@/lib/types';
import { Mountain } from 'lucide-react';

interface Props {
  trail: Trail;
  className?: string;
}

/**
 * Simulated elevation profile for a trail.
 * Generates a realistic-looking elevation curve based on trail distance and elevation gain.
 */
export function ElevationProfile({ trail, className = '' }: Props) {
  const points = useMemo(() => {
    const numPoints = 50;
    const totalKm = trail.totalDistance / 1000;
    const baseElevation = 1800 + Math.sin(trail.id.length) * 400;
    const gain = trail.elevationGain || Math.round(totalKm * 40);
    const pts: { x: number; y: number; dist: number; elev: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const dist = totalKm * t;
      // Generate realistic rolling elevation
      const seed = trail.id.charCodeAt(0) + trail.id.charCodeAt(trail.id.length - 1);
      const elev = baseElevation
        + gain * Math.sin(t * Math.PI * 0.8) * 0.6
        + gain * 0.3 * Math.sin(t * Math.PI * 2.5 + seed)
        + gain * 0.15 * Math.cos(t * Math.PI * 4.2 + seed * 0.7);
      pts.push({ x: t * 100, y: elev, dist, elev: Math.round(elev) });
    }
    return pts;
  }, [trail]);

  const minElev = Math.min(...points.map(p => p.y));
  const maxElev = Math.max(...points.map(p => p.y));
  const range = maxElev - minElev || 1;

  // SVG path
  const chartH = 100;
  const pathData = points.map((p, i) => {
    const x = p.x * 5; // 0-500
    const y = chartH - ((p.y - minElev) / range) * (chartH - 10);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const fillPath = pathData + ` L 500 ${chartH} L 0 ${chartH} Z`;

  return (
    <div className={`bg-card border-t border-border px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Mountain className="w-4 h-4 text-komoot-olive" />
          Elevation Profile
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>↑ {Math.round(maxElev - minElev)}m gain</span>
          <span>{(trail.totalDistance / 1000).toFixed(1)} km</span>
        </div>
      </div>
      <div className="relative">
        <svg viewBox="0 0 500 110" className="w-full h-24" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`elev-grad-${trail.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(80, 45%, 35%)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(80, 45%, 35%)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#elev-grad-${trail.id})`} />
          <path d={pathData} fill="none" stroke="hsl(80, 45%, 35%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0 km</span>
          <span>{(trail.totalDistance / 2000).toFixed(1)} km</span>
          <span>{(trail.totalDistance / 1000).toFixed(1)} km</span>
        </div>
        <div className="absolute top-0 right-0 flex flex-col text-[10px] text-muted-foreground">
          <span>{Math.round(maxElev)}m</span>
        </div>
        <div className="absolute bottom-6 right-0 text-[10px] text-muted-foreground">
          <span>{Math.round(minElev)}m</span>
        </div>
      </div>
    </div>
  );
}
