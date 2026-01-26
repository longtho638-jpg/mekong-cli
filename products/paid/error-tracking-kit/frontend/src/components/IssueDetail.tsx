import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Issue, Event } from '../types';
import { getIssue, getIssueEvents } from '../api';
import { ArrowLeft, Calendar, Tag, User, Globe } from 'lucide-react';
import { format } from 'date-fns';

export const IssueDetail: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventIndex] = useState(0); // Removed unused setter
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (issueId) {
      fetchData(parseInt(issueId));
    }
  }, [issueId]);

  const fetchData = async (id: number) => {
    try {
      const [issueData, eventsData] = await Promise.all([
        getIssue(id),
        getIssueEvents(id)
      ]);
      setIssue(issueData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to fetch issue details', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !issue) {
    return <div className="p-8 text-center">Loading details...</div>;
  }

  const activeEvent = events[selectedEventIndex];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link to={`/projects/${issue.project_id}`} className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} className="mr-1" /> Back to Issues
      </Link>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900 break-all">{issue.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Fingerprint: {issue.fingerprint}</p>
          </div>
          <div className="text-right">
             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
               issue.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
             }`}>
               {issue.status.toUpperCase()}
             </span>
             <p className="text-sm text-gray-500 mt-2">{issue.count} events</p>
          </div>
        </div>
      </div>

      {activeEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Stack Trace */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-sm text-gray-700">
                Stack Trace
              </div>
              <div className="divide-y divide-gray-100">
                {activeEvent.stack_trace.map((frame, idx) => (
                  <div key={idx} className="p-4 hover:bg-gray-50 font-mono text-sm">
                    <div className="flex justify-between text-gray-800 mb-1">
                      <span className="font-semibold">{frame.function || '<anonymous>'}</span>
                      <span className="text-gray-500">{frame.filename}:{frame.lineno}</span>
                    </div>
                    {/* Placeholder for source code context if we had it */}
                    <div className="text-xs text-gray-400 pl-4 border-l-2 border-gray-300">
                      in {frame.filename}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Info */}
            {activeEvent.context.request && (
               <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-sm text-gray-700">
                  Request
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium text-gray-500">URL</div>
                    <div className="col-span-2 break-all">{activeEvent.context.request.url}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium text-gray-500">User-Agent</div>
                    <div className="col-span-2 break-all">{activeEvent.context.request.user_agent}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Event Meta */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
               <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-sm text-gray-700">
                Event Details
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  {format(new Date(activeEvent.timestamp), 'PPpp')}
                </div>
                {activeEvent.context.user && (
                   <div className="flex items-start text-sm text-gray-600">
                    <User size={16} className="mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <div>{activeEvent.context.user.email || activeEvent.context.user.id}</div>
                      <div className="text-xs text-gray-400">ID: {activeEvent.context.user.id}</div>
                    </div>
                  </div>
                )}
                {activeEvent.context.user?.ip_address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe size={16} className="mr-2 text-gray-400" />
                    {activeEvent.context.user.ip_address}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {activeEvent.context.tags && Object.keys(activeEvent.context.tags).length > 0 && (
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-sm text-gray-700">
                  Tags
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {Object.entries(activeEvent.context.tags).map(([key, value]) => (
                    <span key={key} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Tag size={12} className="mr-1" />
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
