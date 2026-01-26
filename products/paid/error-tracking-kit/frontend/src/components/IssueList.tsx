import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Issue } from '../types';
import { getProjectIssues } from '../api';
import { AlertCircle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const IssueList: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchIssues(parseInt(projectId));
    }
  }, [projectId]);

  const fetchIssues = async (pid: number) => {
    try {
      const data = await getProjectIssues(pid);
      setIssues(data);
    } catch (error) {
      console.error('Failed to fetch issues', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading issues...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} className="mr-1" /> Back to Projects
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Issues</h1>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Count
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Last Seen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issues.map((issue) => (
              <tr key={issue.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-center">
                  {issue.count}
                </td>
                <td className="px-6 py-4">
                  <Link to={`/issues/${issue.id}`} className="block">
                    <div className="flex items-center">
                      {issue.status === 'resolved' ? (
                        <CheckCircle size={16} className="text-green-500 mr-2" />
                      ) : (
                        <AlertCircle size={16} className="text-red-500 mr-2" />
                      )}
                      <span className="text-sm font-medium text-indigo-600 hover:text-indigo-900 truncate max-w-xl block">
                        {issue.title}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 ml-6 font-mono">
                      {issue.fingerprint.substring(0, 8)}...
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    {formatDistanceToNow(new Date(issue.last_seen), { addSuffix: true })}
                  </div>
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  No issues reported yet. Good job!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
