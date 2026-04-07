import { useEffect, useRef, useState, useMemo } from 'react';
import nyungweMapImage from '@/assets/nyungwe-map.jpg';
import type { Trail, UserLocation, RestArea, Attraction } from '@/lib/types';
import { OFFICIAL_TRAIL_PATHS, OFFICIAL_TRAIL_VIEWBOX, gpsToViewbox } from '@/lib/official-trail-overlays';
import { RECEPTIONS, getReceptionForTrail, getReceptionViewboxPos, getDirectionPath } from '@/lib/receptions';
import { MapPin, ZoomIn, ZoomOut, Navigation, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAP_IMAGE_WIDTH = 1260;
const MAP_IMAGE_HEIGHT = 1600;

interface TrailMapProps {
  trail: Trail;
  userLocation: UserLocation | null;
  onSelectAttraction?: (attraction: Attraction) => void;
  onSelectRestArea?: (restArea: RestArea) => void;
  showDirections?: boolean;
}

export function TrailMap({ trail, userLocation, showDirections }: TrailMapProps) {
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

  const userViewboxPos = useMemo(() => {
    if (!userLocation || !showUserLocation) return null;
    const pos = gpsToViewbox(userLocation.lat, userLocation.lng);
    if (pos.x < 0 || pos.x > OFFICIAL_TRAIL_VIEWBOX.width || pos.y < 0 || pos.y > OFFICIAL_TRAIL_VIEWBOX.height) return null;
    return pos;
  }, [userLocation, showUserLocation]);

  const userHeading = userLocation?.heading ?? 0;

  // Reception positions on the map
  const receptionMarkers = useMemo(() =>
    RECEPTIONS.map(r => ({ ...r, viewbox: getReceptionViewboxPos(r) })), []);

  // Direction path from nearest reception to trail start
  const directionPathD = useMemo(() => {
    if (!showDirections) return null;
    const reception = getReceptionForTrail(trail.id);
    return getDirectionPath(reception, trail.startPoint);
  }, [showDirections, trail]);

  const activeReception = useMemo(() =>
    showDirections ? getReceptionForTrail(trail.id) : null, [showDirections, trail]);

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

  const centerOnUser = () => {
    if (!userViewboxPos) return;
    const totalScale = fitScale * zoom;
    const mapX = userViewboxPos.x * (MAP_IMAGE_WIDTH / OFFICIAL_TRAIL_VIEWBOX.width) * totalScale;
    const mapY = userViewboxPos.y * (MAP_IMAGE_HEIGHT / OFFICIAL_TRAIL_VIEWBOX.height) * totalScale;
    setPan({ x: -mapX + (viewportSize.width / 2) - (MAP_IMAGE_WIDTH * totalScale / 2), y: -mapY + (viewportSize.height / 2) - (MAP_IMAGE_HEIGHT * totalScale / 2) });
  };

  const totalScale = fitScale * zoom;
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

              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${OFFICIAL_TRAIL_VIEWBOX.width} ${OFFICIAL_TRAIL_VIEWBOX.height}`}
                fill="none"
                preserveAspectRatio="none"
              >
                {/* Roads */}
                {roadPaths.map((path) => (
                  <g key={path.id}>
                    <path d={path.d} stroke="white" strokeWidth={path.strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
                    <path d={path.d} stroke="hsl(var(--destructive))" strokeWidth={path.strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
                  </g>
                ))}

                {/* Walking trails */}
                {trailPaths.map((path) => (
                  <g key={path.id}>
                    <path d={path.d} stroke="hsl(var(--background))" strokeWidth={path.strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
                    <path d={path.d} stroke="hsl(var(--primary))" strokeWidth={path.strokeWidth + 1} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ))}

                {/* Direction path from reception to trail */}
                {directionPathD && (
                  <g>
                    <path d={directionPathD} stroke="white" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
                    <path d={directionPathD} stroke="hsl(var(--chart-4))" strokeWidth={5} strokeLinecap="round" strokeDasharray="15 10" opacity={0.9}>
                      <animate attributeName="stroke-dashoffset" from="0" to="-50" dur="2s" repeatCount="indefinite" />
                    </path>
                  </g>
                )}

                {/* Reception markers */}
                {receptionMarkers.map((r) => {
                  const isActive = activeReception?.id === r.id;
                  const vb = r.viewbox;
                  if (vb.x < 0 || vb.x > OFFICIAL_TRAIL_VIEWBOX.width || vb.y < 0 || vb.y > OFFICIAL_TRAIL_VIEWBOX.height) return null;
                  return (
                    <g key={r.id}>
                      {/* Outer ring for active */}
                      {isActive && (
                        <circle cx={vb.x} cy={vb.y} r={22} fill="none" stroke="hsl(var(--chart-4))" strokeWidth={3} opacity={0.7}>
                          <animate attributeName="r" from="22" to="35" dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.7" to="0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {/* Pin background */}
                      <circle cx={vb.x} cy={vb.y} r={isActive ? 16 : 12} fill={isActive ? "hsl(var(--chart-4))" : "hsl(var(--secondary))"} stroke="white" strokeWidth={3} />
                      {/* Pin icon (simple R) */}
                      <text x={vb.x} y={vb.y + 5} textAnchor="middle" fill="white" fontSize={isActive ? "14" : "11"} fontWeight="bold">R</text>
                      {/* Label */}
                      <text x={vb.x} y={vb.y - 20} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="10" fontWeight="600"
                        stroke="hsl(var(--background))" strokeWidth={3} paintOrder="stroke">{r.name.replace(' Reception', '')}</text>
                    </g>
                  );
                })}

                {/* Trail anchor marker when directions active */}
                {showDirections && (() => {
                  const anchorPos = gpsToViewbox(trail.startPoint.lat, trail.startPoint.lng);
                  if (anchorPos.x < 0 || anchorPos.x > OFFICIAL_TRAIL_VIEWBOX.width) return null;
                  return (
                    <g>
                      <circle cx={anchorPos.x} cy={anchorPos.y} r={12} fill="hsl(var(--primary))" stroke="white" strokeWidth={3} />
                      <text x={anchorPos.x} y={anchorPos.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">T</text>
                      <text x={anchorPos.x} y={anchorPos.y - 18} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="10" fontWeight="600"
                        stroke="hsl(var(--background))" strokeWidth={3} paintOrder="stroke">{trail.name}</text>
                    </g>
                  );
                })()}

                {/* User location */}
                {userViewboxPos && (
                  <g>
                    <circle cx={userViewboxPos.x} cy={userViewboxPos.y} r={30} fill="hsl(var(--primary))" opacity={0.15} />
                    {userHeading !== undefined && (
                      <g transform={`translate(${userViewboxPos.x}, ${userViewboxPos.y}) rotate(${userHeading})`}>
                        <polygon points="0,-20 -8,8 0,2 8,8" fill="hsl(var(--primary))" stroke="white" strokeWidth={2} />
                      </g>
                    )}
                    <circle cx={userViewboxPos.x} cy={userViewboxPos.y} r={8} fill="hsl(var(--primary))" stroke="white" strokeWidth={3} />
                    <circle cx={userViewboxPos.x} cy={userViewboxPos.y} r={8} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} opacity={0.6}>
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
              {showDirections ? 'Directions from reception shown' : userViewboxPos ? 'Live GPS tracking active' : 'GPS position outside map area'}
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
        <Button variant={showUserLocation ? "default" : "secondary"} size="icon" className="shadow-md" onClick={() => setShowUserLocation(!showUserLocation)}>
          <Navigation className="h-4 w-4" />
        </Button>
        {userViewboxPos && (
          <Button variant="secondary" size="icon" className="shadow-md" onClick={centerOnUser}>
            <Locate className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Speed indicator */}
      {userLocation && userLocation.speed && userLocation.speed > 0.3 && (
        <div className="absolute bottom-4 left-4 z-30 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" style={{ transform: `rotate(${userHeading}deg)` }} />
            <div>
              <div className="text-xs text-muted-foreground">Speed</div>
              <div className="text-sm font-semibold text-foreground">{((userLocation.speed ?? 0) * 3.6).toFixed(1)} km/h</div>
            </div>
            <div className="ml-2">
              <div className="text-xs text-muted-foreground">Heading</div>
              <div className="text-sm font-semibold text-foreground">{getCardinalDirection(userHeading)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCardinalDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(heading / 45) % 8];
}
