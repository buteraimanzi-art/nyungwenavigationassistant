export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TrailPoint extends Coordinates {
  elevation: number;
  distanceFromStart: number;
}

export interface Trail {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'moderate' | 'difficult' | 'expert';
  totalDistance: number;
  estimatedDuration: number;
  elevationGain: number;
  path: TrailPoint[];
  attractions: Attraction[];
  restAreas: RestArea[];
  startPoint: Coordinates;
  endPoint: Coordinates;
}

export interface Attraction {
  id: string;
  name: string;
  type: 'viewpoint' | 'waterfall' | 'wildlife' | 'flora' | 'historical' | 'campsite';
  description: string;
  coordinates: Coordinates;
  distanceFromTrail: number;
  image?: string;
}

export interface RestArea {
  id: string;
  name: string;
  type: 'bench' | 'shelter' | 'picnic' | 'toilet';
  coordinates: Coordinates;
  amenities: string[];
  capacity: number;
}

export interface UserLocation extends Coordinates {
  accuracy: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

export interface TrailProgress {
  distanceCovered: number;
  distanceRemaining: number;
  estimatedTimeRemaining: number;
  currentElevation: number;
  nearestRestArea: RestArea | null;
  distanceToNearestRestArea: number;
  nearbyAttractions: Array<Attraction & { distance: number }>;
  percentComplete: number;
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  userName: string;
  location: Coordinates;
  timestamp: number;
  issueType: 'injury' | 'lost' | 'wildlife' | 'weather' | 'medical' | 'other';
  description: string;
  status: 'active' | 'responding' | 'resolved';
  trailId: string;
  trailName: string;
}
