import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Session } from '../types';
import { getProjectSessions } from '../api';
import { PlayCircle, Clock, ArrowLeft, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const SessionList: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchSessions(parseInt(projectId));
    }
  }, [projectId]);

  const fetchSessions = async (pid: number) => {
    try {
      const data = await getProjectSessions(pid);
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading sessions...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} className="mr-1" /> Back to Projects
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Recorded Sessions</h1>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Started
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => {
                const start = new Date(session.started_at);
                const end = session.ended_at ? new Date(session.ended_at) : start;
                const durationSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
                const duration = durationSeconds > 60
                    ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
                    : `${durationSeconds}s`;

                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {session.user_id || 'Anonymous'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-6 truncate max-w-xs" title={session.user_agent}>
                        {session.user_agent?.split(')')[0] + ')' || 'Unknown Agent'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {formatDistanceToNow(start, { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/sessions/${session.id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center">
                        <PlayCircle size={18} className="mr-1" /> Play
                      </Link>
                    </td>
                  </tr>
                );
            })}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No sessions recorded yet. Waiting for visitors...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
