import React, { useEffect, useState } from 'react';
import { useAnalyticsStore } from '../analytics/analytics.js';

export const AnalyticsDashboard: React.FC = () => {
  const { getMetrics, events } = useAnalyticsStore();
  // Force update to show metrics in real-time
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const metrics = getMetrics();
  const searchEvents = events
    .filter((e) => e.type === 'search')
    .slice(-10)
    .reverse();

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Search Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-500 font-medium">Total Searches</div>
          <div className="text-2xl font-bold text-blue-700">{metrics.totalSearches}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-green-500 font-medium">Total Clicks</div>
          <div className="text-2xl font-bold text-green-700">{metrics.totalClicks}</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-sm text-purple-500 font-medium">CTR</div>
          <div className="text-2xl font-bold text-purple-700">{metrics.ctr.toFixed(2)}%</div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Searches</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Results</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {searchEvents.map((event, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.data.query || '(empty)'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.data.resultsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
