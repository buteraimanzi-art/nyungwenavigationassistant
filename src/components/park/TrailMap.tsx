import { useEffect, useRef, useState } from 'react';
import nyungweMapImage from '@/assets/nyungwe-map.jpg';
import type { Trail, UserLocation, RestArea, Attraction } from '@/lib/types';
import { OFFICIAL_TRAIL_PATHS, OFFICIAL_TRAIL_VIEWBOX } from '@/lib/official-trail-overlays';
import { MapPin, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAP_IMAGE_WIDTH = 1260;
const MAP_IMAGE_HEIGHT = 1600;

interface TrailMapProps {
  trail: Trail;
  userLocation: UserLocation | null;
  onSelectAttraction?: (attraction: Attraction) => void;
  onSelectRestArea?: (restArea: RestArea) => void;
}

export function TrailMap({ trail }: TrailMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fitScale = viewportSize.width && viewportSize.height
    ? Math.min(viewportSize.width / MAP_IMAGE_WIDTH, viewportSize.height / MAP_IMAGE_HEIGHT)
    : 0.4;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((currentZoom) => Math.max(0.8, Math.min(5, currentZoom * (e.deltaY > 0 ? 0.9 : 1.1))));
  };

  const overlayStroke = 'hsl(var(--primary))';
  const overlayHalo = 'hsl(var(--background))';
  const totalScale = fitScale * zoom;

  return (
    <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-lg border border-border bg-muted">
      <div
        ref={containerRef}
        className="relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="origin-center transition-transform duration-100" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
            <div className="relative origin-center transition-transform duration-100" style={{ width: MAP_IMAGE_WIDTH, height: MAP_IMAGE_HEIGHT, transform: `scale(${totalScale})` }}>
              <img src={nyungweMapImage} alt="Official Nyungwe National Park trail map" className="absolute inset-0 h-full w-full select-none" draggable={false} />

              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${OFFICIAL_TRAIL_VIEWBOX.width} ${OFFICIAL_TRAIL_VIEWBOX.height}`}
                fill="none"
                preserveAspectRatio="none"
              >
                {OFFICIAL_TRAIL_PATHS.map((path) => (
                  <g key={path.id}>
                    <path d={path.d} stroke={overlayHalo} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.96} />
                    <path d={path.d} stroke={overlayStroke} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-4 top-4 z-30 max-w-xs rounded-lg border border-border bg-card/95 px-3 py-2 shadow-md backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <div className="text-sm font-semibold text-foreground">{trail.name}</div>
            <p className="text-xs text-muted-foreground">Official Nyungwe trail pathways traced directly from your uploaded PDF map.</p>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-30 flex flex-col gap-2">
        <Button variant="secondary" size="icon" className="shadow-md" onClick={() => setZoom((currentZoom) => Math.min(currentZoom * 1.2, 5))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="shadow-md" onClick={() => setZoom((currentZoom) => Math.max(currentZoom / 1.2, 0.8))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
