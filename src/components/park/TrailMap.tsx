import { useEffect, useRef, useState, useMemo } from 'react';
import nyungweMapImage from '@/assets/nyungwe-map.jpg';
import type { Trail, UserLocation, RestArea, Attraction } from '@/lib/types';
import { OFFICIAL_TRAIL_PATHS, OFFICIAL_TRAIL_VIEWBOX, gpsToViewbox } from '@/lib/official-trail-overlays';
import { MapPin, ZoomIn, ZoomOut, Navigation, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAP_IMAGE_WIDTH = 1260;
const MAP_IMAGE_HEIGHT = 1600;

interface TrailMapProps {
  trail: Trail;
  userLocation: UserLocation | null;
  onSelectAttraction?: (attraction: Attraction) => void;
  onSelectRestArea?: (restArea: RestArea) => void;
}

export function TrailMap({ trail, userLocation }: TrailMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [showUserLocation, setShowUserLocation] = useState(true);

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

  // Convert user GPS location to viewbox coordinates
  const userViewboxPos = useMemo(() => {
    if (!userLocation || !showUserLocation) return null;
    const pos = gpsToViewbox(userLocation.lat, userLocation.lng);
    // Check if position is within the map bounds
    if (pos.x < 0 || pos.x > OFFICIAL_TRAIL_VIEWBOX.width || pos.y < 0 || pos.y > OFFICIAL_TRAIL_VIEWBOX.height) {
      return null;
    }
    return pos;
  }, [userLocation, showUserLocation]);

  // Convert user heading for direction arrow
  const userHeading = userLocation?.heading ?? 0;

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
    setZoom((z) => Math.max(0.8, Math.min(5, z * (e.deltaY > 0 ? 0.9 : 1.1))));
  };

  // Center map on user location
  const centerOnUser = () => {
    if (!userViewboxPos) return;
    const totalScale = fitScale * zoom;
    // Calculate pan to center the user's position
    const mapX = userViewboxPos.x * (MAP_IMAGE_WIDTH / OFFICIAL_TRAIL_VIEWBOX.width) * totalScale;
    const mapY = userViewboxPos.y * (MAP_IMAGE_HEIGHT / OFFICIAL_TRAIL_VIEWBOX.height) * totalScale;
    setPan({ x: -mapX + (viewportSize.width / 2) - (MAP_IMAGE_WIDTH * totalScale / 2), y: -mapY + (viewportSize.height / 2) - (MAP_IMAGE_HEIGHT * totalScale / 2) });
  };

  const totalScale = fitScale * zoom;

  // Separate trails from roads for different styling
  const trailPaths = OFFICIAL_TRAIL_PATHS.filter(p => p.category === 'trail');
  const roadPaths = OFFICIAL_TRAIL_PATHS.filter(p => p.category === 'road');

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

              {/* SVG overlay with trails, roads, and user position */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${OFFICIAL_TRAIL_VIEWBOX.width} ${OFFICIAL_TRAIL_VIEWBOX.height}`}
                fill="none"
                preserveAspectRatio="none"
              >
                {/* Roads - red with white halo */}
                {roadPaths.map((path) => (
                  <g key={path.id}>
                    <path d={path.d} stroke="white" strokeWidth={path.strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
                    <path d={path.d} stroke="hsl(var(--destructive))" strokeWidth={path.strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
                  </g>
                ))}

                {/* Walking trails - primary color with halo */}
                {trailPaths.map((path) => (
                  <g key={path.id}>
                    <path d={path.d} stroke="hsl(var(--background))" strokeWidth={path.strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
                    <path d={path.d} stroke="hsl(var(--primary))" strokeWidth={path.strokeWidth + 1} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ))}

                {/* User location dot */}
                {userViewboxPos && (
                  <g>
                    {/* Accuracy circle */}
                    <circle
                      cx={userViewboxPos.x}
                      cy={userViewboxPos.y}
                      r={30}
                      fill="hsl(var(--primary))"
                      opacity={0.15}
                    />
                    {/* Direction arrow */}
                    {userHeading !== undefined && (
                      <g transform={`translate(${userViewboxPos.x}, ${userViewboxPos.y}) rotate(${userHeading})`}>
                        <polygon
                          points="0,-20 -8,8 0,2 8,8"
                          fill="hsl(var(--primary))"
                          stroke="white"
                          strokeWidth={2}
                        />
                      </g>
                    )}
                    {/* Center dot */}
                    <circle
                      cx={userViewboxPos.x}
                      cy={userViewboxPos.y}
                      r={8}
                      fill="hsl(var(--primary))"
                      stroke="white"
                      strokeWidth={3}
                    />
                    {/* Pulsing ring */}
                    <circle
                      cx={userViewboxPos.x}
                      cy={userViewboxPos.y}
                      r={8}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      opacity={0.6}
                    >
                      <animate attributeName="r" from="8" to="25" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Trail info badge */}
      <div className="absolute left-4 top-4 z-30 max-w-xs rounded-lg border border-border bg-card/95 px-3 py-2 shadow-md backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <div className="text-sm font-semibold text-foreground">{trail.name}</div>
            <p className="text-xs text-muted-foreground">
              {userViewboxPos ? 'Live GPS tracking active' : 'GPS position outside map area'}
            </p>
            {userLocation && (
              <p className="mt-0.5 text-xs font-mono text-muted-foreground">
                {userLocation.lat.toFixed(4)}°S, {userLocation.lng.toFixed(4)}°E
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Map controls */}
      <div className="absolute right-4 top-4 z-30 flex flex-col gap-2">
        <Button variant="secondary" size="icon" className="shadow-md" onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="shadow-md" onClick={() => setZoom((z) => Math.max(z / 1.2, 0.8))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant={showUserLocation ? "default" : "secondary"}
          size="icon"
          className="shadow-md"
          onClick={() => setShowUserLocation(!showUserLocation)}
        >
          <Navigation className="h-4 w-4" />
        </Button>
        {userViewboxPos && (
          <Button variant="secondary" size="icon" className="shadow-md" onClick={centerOnUser}>
            <Locate className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Direction indicator */}
      {userLocation && userLocation.speed && userLocation.speed > 0.3 && (
        <div className="absolute bottom-4 left-4 z-30 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" style={{ transform: `rotate(${userHeading}deg)` }} />
            <div>
              <div className="text-xs text-muted-foreground">Speed</div>
              <div className="text-sm font-semibold text-foreground">
                {((userLocation.speed ?? 0) * 3.6).toFixed(1)} km/h
              </div>
            </div>
            <div className="ml-2">
              <div className="text-xs text-muted-foreground">Heading</div>
              <div className="text-sm font-semibold text-foreground">
                {getCardinalDirection(userHeading)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCardinalDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}
