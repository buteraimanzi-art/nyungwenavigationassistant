import { useState } from 'react';
import { Layers, Map, Satellite, Mountain } from 'lucide-react';

export type MapLayer = 'street' | 'satellite' | 'terrain';

interface Props {
  currentLayer: MapLayer;
  onChange: (layer: MapLayer) => void;
}

const layers: { id: MapLayer; label: string; icon: React.ReactNode }[] = [
  { id: 'street', label: 'Street', icon: <Map className="w-4 h-4" /> },
  { id: 'satellite', label: 'Satellite', icon: <Satellite className="w-4 h-4" /> },
  { id: 'terrain', label: 'Terrain', icon: <Mountain className="w-4 h-4" /> },
];

export function MapLayerToggle({ currentLayer, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-3 right-3 z-[1000]">
      {isOpen ? (
        <div className="bg-card rounded-xl shadow-lg border border-border p-1.5 space-y-1">
          {layers.map(l => (
            <button
              key={l.id}
              onClick={() => { onChange(l.id); setIsOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentLayer === l.id ? 'bg-komoot-olive text-primary-foreground' : 'text-foreground hover:bg-muted'
              }`}
            >
              {l.icon} {l.label}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 rounded-xl bg-card border border-border shadow-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          title="Map layers"
        >
          <Layers className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
