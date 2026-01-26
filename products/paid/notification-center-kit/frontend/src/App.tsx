import { useState } from 'react';
import { NotificationFeed } from './components/NotificationFeed';
import { Send } from 'lucide-react';

// For demo purposes, we'll hardcode a user ID
const DEMO_USER_ID = "user_123";

function App() {
  const [lastSent, setLastSent] = useState<string | null>(null);

  const sendTestNotification = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: DEMO_USER_ID,
          type: 'info',
          title: 'New Project Created',
          body: `Project "Marketing Campaign ${Math.floor(Math.random() * 100)}" has been created successfully.`,
          data: { project_id: 123 }
        }),
      });

      if (response.ok) {
        setLastSent(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to send test notification', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">AppDashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Logged in as {DEMO_USER_ID}</span>
              {/* Notification Bell Component */}
              <NotificationFeed userId={DEMO_USER_ID} />
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                U
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Demo Controls */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">Demo Controls</h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>Simulate backend events to see real-time notifications appear in the bell.</p>
                    </div>
                    <div className="mt-5">
                        <button
                            onClick={sendTestNotification}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Send className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
                            Trigger Test Notification
                        </button>
                        {lastSent && (
                            <p className="mt-3 text-xs text-green-600">
                                Last sent: {lastSent}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Placeholder */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">Dashboard Content</h3>
                    <div className="mt-2 border-4 border-dashed border-gray-200 rounded-lg h-64 flex items-center justify-center">
                        <p className="text-gray-400">Your App Content Here</p>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
