import React, { useEffect, useState } from 'react';
import { webhookApi } from '../api/client';
import { WebhookEvent } from '../types';
import { format } from 'date-fns';
import { ChevronRight, Box, Activity } from 'lucide-react';

export const EventList: React.FC = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await webhookApi.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Event List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Incoming Events</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {events.length}
            </span>
        </div>
        <div className="flex-1 overflow-y-auto">
            {loading && events.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {events.map(event => (
                        <li
                            key={event.id}
                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedEvent?.id === event.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                            onClick={() => setSelectedEvent(event)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Activity className="h-5 w-5 text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 truncate w-48">
                                            {event.event_type}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300" />
                            </div>
                        </li>
                    ))}
                    {events.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-500">
                            No events received yet.
                        </div>
                    )}
                </ul>
            )}
        </div>
      </div>

      {/* Event Details */}
      <div className="w-full md:w-2/3 flex flex-col bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Event Payload</h3>
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            {selectedEvent ? (
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">{selectedEvent.event_type}</h2>
                            <span className="text-sm text-gray-500 font-mono">ID: {selectedEvent.id}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Received at {format(new Date(selectedEvent.created_at), 'PPP pp')}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payload Data</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedEvent.payload, null, 2))}
                                className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                                Copy JSON
                            </button>
                        </div>
                        <pre className="p-4 text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(selectedEvent.payload, null, 2)}
                        </pre>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Box className="h-16 w-16 mb-4 text-gray-300" />
                    <p>Select an event to view its payload</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
