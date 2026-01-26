import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Session } from '../types';
import { getSession, getSessionEvents } from '../api';
import { ArrowLeft } from 'lucide-react';
import rrwebPlayer from 'rrweb-player';

export const SessionPlayer: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null); // To store the player instance

  useEffect(() => {
    if (sessionId) {
      fetchData(sessionId);
    }

    // Cleanup on unmount
    return () => {
        if (playerContainerRef.current) {
            // Safer way to clear content than innerHTML
            while (playerContainerRef.current.firstChild) {
                playerContainerRef.current.removeChild(playerContainerRef.current.firstChild);
            }
        }
    };
  }, [sessionId]);

  const fetchData = async (sid: string) => {
    try {
      const sessionData = await getSession(sid);
      setSession(sessionData);

      const eventsData = await getSessionEvents(sid);

      // Parse JSON blobs and merge into a single array
      const allEvents = eventsData.flatMap(e => {
          try {
              return JSON.parse(e.events_blob);
          } catch (err) {
              console.error("Failed to parse event chunk", err);
              return [];
          }
      });

      if (allEvents.length > 0 && playerContainerRef.current) {
          // Initialize player
          const Player = (rrwebPlayer as any);
          playerRef.current = new Player({
              target: playerContainerRef.current,
              props: {
                  events: allEvents,
                  width: 1024,
                  height: 576,
                  autoPlay: true,
                  showController: true,
              },
          });
      }

    } catch (error) {
      console.error('Failed to load session', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading player...</div>;
  }

  if (!session) {
      return <div className="p-8 text-center text-red-600">Session not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link to={`/projects/${session.project_id}`} className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} className="mr-1" /> Back to Sessions
      </Link>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900">
            Session Replay: {session.user_id || 'Anonymous'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
            {new Date(session.started_at).toLocaleString()}
            {session.user_agent && ` • ${session.user_agent}`}
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 flex justify-center items-center shadow-lg">
          <div ref={playerContainerRef} className="bg-white"></div>
          {!playerRef.current && (
              <div className="text-white">No events to replay.</div>
          )}
      </div>
    </div>
  );
};
