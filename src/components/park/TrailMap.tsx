import { useRef, useState, useCallback } from 'react';
import type { Trail, UserLocation, RestArea, Attraction } from '@/lib/types';
import { coordsToPercent } from '@/lib/trail-data';
import { MapPin, Navigation, ZoomIn, ZoomOut, Locate, Eye, Droplets, Bird, Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrailMapProps {
  trail: Trail;
  userLocation: UserLocation | null;
  onSelectAttraction?: (attraction: Attraction) => void;
  onSelectRestArea?: (restArea: RestArea) => void;
}

function getAttractionIcon(type: string) {
  switch (type) {
    case 'viewpoint': return <Eye className="w-3 h-3" />;
    case 'waterfall': return <Droplets className="w-3 h-3" />;
    case 'wildlife': return <Bird className="w-3 h-3" />;
    case 'flora': return <Flower2 className="w-3 h-3" />;
    default: return <MapPin className="w-3 h-3" />;
  }
}

function getAttractionColor(type: string) {
  switch (type) {
    case 'viewpoint': return 'bg-viewpoint';
    case 'waterfall': return 'bg-water';
    case 'wildlife': return 'bg-wildlife';
    case 'flora': return 'bg-flora';
    default: return 'bg-primary';
  }
}

export function TrailMap({ trail, userLocation, onSelectAttraction, onSelectRestArea }: TrailMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const centerOnUser = useCallback(() => {
    if (userLocation && containerRef.current) {
      const pos = coordsToPercent(userLocation.lat, userLocation.lng);
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: (rect.width / 2) - (pos.x / 100 * rect.width * zoom), y: (rect.height / 2) - (pos.y / 100 * rect.height * zoom) });
      setZoom(2);
    }
  }, [userLocation, zoom]);

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
    setZoom(z => Math.max(0.5, Math.min(5, z * (e.deltaY > 0 ? 0.9 : 1.1))));
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-border bg-muted">
      <div ref={containerRef} className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} onWheel={handleWheel}>
        <div className="absolute origin-top-left transition-transform duration-100" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: '100%', height: '100%' }}>
          <div className="relative w-full h-full">
            <img src="/images/nyungwe-trails-map.jpg" alt="Nyungwe Forest National Park Trail Map" className="w-full h-full object-contain" draggable={false} />

            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d={trail.path.map((point, i) => { const pos = coordsToPercent(point.lat, point.lng); return `${i === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`; }).join(' ')}
                fill="none" stroke="hsl(152, 55%, 28%)" strokeWidth={0.8 / zoom} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${2 / zoom} ${1 / zoom}`} />
            </svg>

            {/* Start marker */}
            {(() => { const pos = coordsToPercent(trail.startPoint.lat, trail.startPoint.lng); return (
              <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <div className="w-6 h-6 rounded-full bg-primary border-2 border-primary-foreground shadow-lg flex items-center justify-center text-primary-foreground text-xs font-bold">S</div>
              </div>
            ); })()}

            {/* End marker */}
            {(() => { const pos = coordsToPercent(trail.endPoint.lat, trail.endPoint.lng); return (
              <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <div className="w-6 h-6 rounded-full bg-accent border-2 border-primary-foreground shadow-lg flex items-center justify-center text-accent-foreground text-xs font-bold">E</div>
              </div>
            ); })()}

            {/* Rest areas */}
            {trail.restAreas.map(ra => { const pos = coordsToPercent(ra.coordinates.lat, ra.coordinates.lng); return (
              <div key={ra.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={(e) => { e.stopPropagation(); setSelectedMarker(ra.id); onSelectRestArea?.(ra); }}>
                <div className="w-5 h-5 rounded-full bg-water border-2 border-primary-foreground shadow-lg flex items-center justify-center text-primary-foreground">
                  <MapPin className="w-3 h-3" />
                </div>
                {selectedMarker === ra.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-card/95 backdrop-blur-sm rounded-lg p-2 shadow-lg text-xs whitespace-nowrap z-50 border border-border">
                    <div className="font-semibold text-foreground">{ra.name}</div>
                    <div className="text-muted-foreground capitalize">{ra.type}</div>
                  </div>
                )}
              </div>
            ); })}

            {/* Attractions */}
            {trail.attractions.map(att => { const pos = coordsToPercent(att.coordinates.lat, att.coordinates.lng); return (
              <div key={att.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={(e) => { e.stopPropagation(); setSelectedMarker(att.id); onSelectAttraction?.(att); }}>
                <div className={`w-5 h-5 rounded-full ${getAttractionColor(att.type)} border-2 border-primary-foreground shadow-lg flex items-center justify-center text-primary-foreground`}>
                  {getAttractionIcon(att.type)}
                </div>
                {selectedMarker === att.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-card/95 backdrop-blur-sm rounded-lg p-2 shadow-lg text-xs whitespace-nowrap z-50 border border-border">
                    <div className="font-semibold text-foreground">{att.name}</div>
                    <div className="text-muted-foreground capitalize">{att.type}</div>
                  </div>
                )}
              </div>
            ); })}

            {/* User location */}
            {userLocation && (() => { const pos = coordsToPercent(userLocation.lat, userLocation.lng); return (
              <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-water border-2 border-primary-foreground shadow-lg" />
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-water animate-ping opacity-40" />
                  {userLocation.heading !== undefined && (
                    <Navigation className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 text-water" style={{ transform: `translateX(-50%) rotate(${userLocation.heading}deg)` }} />
                  )}
                </div>
              </div>
            ); })()}
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
        <Button variant="secondary" size="icon" className="shadow-md" onClick={() => setZoom(z => Math.min(z * 1.5, 5))}><ZoomIn className="w-4 h-4" /></Button>
        <Button variant="secondary" size="icon" className="shadow-md" onClick={() => setZoom(z => Math.max(z / 1.5, 0.5))}><ZoomOut className="w-4 h-4" /></Button>
        {userLocation && <Button variant="secondary" size="icon" className="shadow-md" onClick={centerOnUser}><Locate className="w-4 h-4" /></Button>}
      </div>
    </div>
  );
}
