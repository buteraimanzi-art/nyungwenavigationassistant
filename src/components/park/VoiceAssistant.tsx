import { useState, useCallback } from 'react';
import { Mic, MicOff, Volume2, X, MapPin, Armchair, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Trail, UserLocation, TrailProgress } from '@/lib/types';

interface Props {
  trail: Trail | null;
  userLocation: UserLocation | null;
  progress: TrailProgress | null;
  isNavigating: boolean;
}

const RESPONSES: Record<string, (trail: Trail | null, progress: TrailProgress | null) => string> = {
  'rest': (trail, progress) => {
    if (progress?.nearestRestArea) return `The nearest rest area is ${progress.nearestRestArea.name}, about ${progress.distanceToNearestRestArea} meters away. It has ${progress.nearestRestArea.amenities.join(', ')}.`;
    if (trail && trail.restAreas.length > 0) return `This trail has ${trail.restAreas.length} rest areas. The first one is ${trail.restAreas[0].name}.`;
    return 'I don\'t see any rest areas nearby on your current trail.';
  },
  'attraction': (trail, progress) => {
    if (progress?.nearbyAttractions && progress.nearbyAttractions.length > 0) return `There are ${progress.nearbyAttractions.length} attractions nearby. The closest is ${progress.nearbyAttractions[0].name}, ${progress.nearbyAttractions[0].distance} meters away.`;
    if (trail && trail.attractions.length > 0) return `This trail features ${trail.attractions.length} attractions including ${trail.attractions.map(a => a.name).slice(0, 3).join(', ')}.`;
    return 'No attractions found near your current location.';
  },
  'progress': (_trail, progress) => {
    if (progress) return `You've covered ${progress.percentComplete}% of the trail. About ${Math.round(progress.distanceRemaining)} meters remaining.`;
    return 'Start a trail to track your progress.';
  },
  'help': (_trail: Trail | null, _progress: TrailProgress | null) => 'You can ask me about rest areas, nearby attractions, trail progress, or directions. Try saying "rest areas" or "attractions nearby".',
};

export function VoiceAssistant({ trail, userLocation, progress, isNavigating }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const processQuery = useCallback((query: string) => {
    const q = query.toLowerCase();
    let answer: string;
    if (q.includes('rest') || q.includes('shelter') || q.includes('bench') || q.includes('stop')) {
      answer = RESPONSES['rest'](trail, progress);
    } else if (q.includes('attract') || q.includes('viewpoint') || q.includes('waterfall') || q.includes('wildlife') || q.includes('see')) {
      answer = RESPONSES['attraction'](trail, progress);
    } else if (q.includes('progress') || q.includes('far') || q.includes('remain') || q.includes('distance')) {
      answer = RESPONSES['progress'](trail, progress);
    } else {
      answer = RESPONSES['help'](trail, progress);
    }
    setResponse(answer);
    speak(answer);
  }, [trail, progress, speak]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setResponse('Speech recognition is not supported in this browser. Try typing your question.');
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      processQuery(text);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setResponse('Could not hear you. Try again or tap a quick action below.');
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [processQuery]);

  const quickActions = [
    { label: 'Rest Areas', icon: <Armchair className="w-3 h-3" />, query: 'rest areas' },
    { label: 'Attractions', icon: <MapPin className="w-3 h-3" />, query: 'attractions nearby' },
    { label: 'Progress', icon: <Navigation className="w-3 h-3" />, query: 'my progress' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-4 z-50 w-14 h-14 rounded-full bg-komoot-olive text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        title="Voice Assistant"
      >
        <Mic className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-28 right-4 z-50 w-80">
      <Card className="rounded-2xl shadow-2xl border-komoot-olive/30 overflow-hidden">
        <div className="bg-komoot-olive px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Volume2 className="w-4 h-4" />
            <span className="text-sm font-bold">Trail Guide</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20 rounded-full" onClick={() => { setIsOpen(false); window.speechSynthesis?.cancel(); }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardContent className="p-4 space-y-3">
          {response && (
            <div className="bg-komoot-olive/5 rounded-xl p-3 text-sm text-foreground leading-relaxed">
              {transcript && <p className="text-xs text-muted-foreground mb-1 italic">"{transcript}"</p>}
              {response}
            </div>
          )}

          {!response && (
            <p className="text-sm text-muted-foreground text-center py-2">Ask me about rest areas, attractions, or your progress!</p>
          )}

          <div className="flex gap-2 flex-wrap">
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => { setTranscript(a.query); processQuery(a.query); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-foreground hover:bg-komoot-olive/10 transition-colors"
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          <Button
            className={`w-full gap-2 rounded-xl ${isListening ? 'bg-destructive hover:bg-destructive/90' : 'bg-komoot-olive hover:bg-komoot-olive/90'} text-primary-foreground`}
            onClick={isListening ? () => setIsListening(false) : startListening}
          >
            {isListening ? <><MicOff className="w-4 h-4" /> Listening...</> : <><Mic className="w-4 h-4" /> Tap to speak</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
