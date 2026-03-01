/**
 * Itinerary Facade — Travel Hub SDK
 * Trip planning, day-by-day schedules, activity bookings
 */

export interface Activity {
  id: string;
  name: string;
  description: string;
  location: string;
  durationHours: number;
  price: number;
  category: 'sightseeing' | 'adventure' | 'culture' | 'food' | 'relaxation';
}

export interface ItineraryDay {
  date: string;
  activities: Activity[];
  accommodation?: string;
  notes?: string;
}

export interface Itinerary {
  id: string;
  travelerId: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: ItineraryDay[];
  totalCost: number;
}

export function createItineraryPlanner() {
  return {
    createItinerary: async (_travelerId: string, _destination: string, _startDate: string, _endDate: string): Promise<Itinerary> => {
      throw new Error('Implement with your itinerary backend');
    },
    addActivity: async (_itineraryId: string, _day: string, _activityId: string): Promise<ItineraryDay> => {
      throw new Error('Implement with your itinerary backend');
    },
    suggestActivities: async (_destination: string, _interests: string[]): Promise<Activity[]> => {
      throw new Error('Implement with your activity recommendation backend');
    },
    optimizeRoute: async (_itineraryId: string): Promise<Itinerary> => {
      throw new Error('Implement with your route optimization backend');
    },
    shareItinerary: async (_itineraryId: string, _email: string): Promise<void> => {
      throw new Error('Implement with your sharing backend');
    },
  };
}
