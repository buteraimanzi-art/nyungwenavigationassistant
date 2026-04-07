import { useRef, useState } from 'react';
import nyungweMapImage from '@/assets/nyungwe-map.jpg';
import type { Trail, UserLocation, RestArea, Attraction } from '@/lib/types';
import { MapPin, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    setZoom((currentZoom) => Math.max(0.75, Math.min(4, currentZoom * (e.deltaY > 0 ? 0.9 : 1.1))));
  };

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
        <div
          className="absolute origin-top-left transition-transform duration-100"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: '100%', height: '100%' }}
        >
          <img src={nyungweMapImage} alt="Official Nyungwe National Park trail map" className="h-full w-full select-none object-contain" draggable={false} />
        </div>
      </div>

      <div className="absolute left-4 top-4 z-30 max-w-xs rounded-lg border border-border bg-card/95 px-3 py-2 shadow-md backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <div className="text-sm font-semibold text-foreground">{trail.name}</div>
            <p className="text-xs text-muted-foreground">Using your uploaded official Nyungwe map without generated trail overlays.</p>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-30 flex flex-col gap-2">
        <Button variant="secondary" size="icon" className="shadow-md" onClick={() => setZoom((currentZoom) => Math.min(currentZoom * 1.2, 4))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="shadow-md" onClick={() => setZoom((currentZoom) => Math.max(currentZoom / 1.2, 0.75))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
