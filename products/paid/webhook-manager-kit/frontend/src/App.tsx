import React, { useState } from 'react';
import { useWebhooks, useDeliveries } from './hooks/useWebhooks';
import { EndpointList } from './components/EndpointList';
import { EndpointForm } from './components/EndpointForm';
import { DeliveryLogs } from './components/DeliveryLogs';
import { WebhookEndpoint } from './types';
import { webhookApi } from './api/client';
import { LayoutDashboard, Zap, RefreshCw } from 'lucide-react';

function App() {
  const { endpoints, loading: endpointsLoading, createEndpoint, deleteEndpoint } = useWebhooks();
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { deliveries, loading: deliveriesLoading } = useDeliveries(selectedEndpoint?.id || null);
  const [triggering, setTriggering] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleCreate = async (data: any) => {
    await createEndpoint(data);
    setIsAdding(false);
  };

  const handleSelect = (endpoint: WebhookEndpoint) => {
    setSelectedEndpoint(endpoint);
    setIsAdding(false);
  };

  const handleTriggerTest = async () => {
    setTriggering(true);
    try {
        await webhookApi.triggerEvent('test.event', {
            timestamp: new Date().toISOString(),
            message: 'Hello from Webhook Manager Kit!'
        });
        alert('Test event triggered! Check logs.');
    } catch (e) {
        alert('Failed to trigger event');
    } finally {
        setTriggering(false);
    }
  };

  const handleRetryFailed = async () => {
      setRetrying(true);
      try {
          const res = await webhookApi.retryFailed();
          alert(res.message);
      } catch (e) {
          alert('Failed to retry');
      } finally {
          setRetrying(false);
      }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <LayoutDashboard className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Webhook Manager</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
                <button
                    onClick={handleRetryFailed}
                    disabled={retrying}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                    Retry Failed
                </button>
                <button
                    onClick={handleTriggerTest}
                    disabled={triggering}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none shadow-sm"
                >
                    <Zap className="h-4 w-4 mr-2" />
                    Trigger Test Event
                </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
          {/* Left Sidebar: Endpoints */}
          <div className="w-full md:w-1/3 flex flex-col space-y-4">
             {isAdding ? (
                 <EndpointForm onSave={handleCreate} onCancel={() => setIsAdding(false)} />
             ) : (
                 <EndpointList
                    endpoints={endpoints}
                    onSelect={handleSelect}
                    onDelete={deleteEndpoint}
                    selectedId={selectedEndpoint?.id || null}
                    onAdd={() => { setSelectedEndpoint(null); setIsAdding(true); }}
                 />
             )}
          </div>

          {/* Right Content: Logs */}
          <div className="w-full md:w-2/3 flex flex-col">
            {selectedEndpoint ? (
                <>
                    <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">{selectedEndpoint.description || selectedEndpoint.url}</h2>
                        <p className="text-sm text-gray-500 truncate">{selectedEndpoint.url}</p>
                        <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded inline-block">
                            Secret: {selectedEndpoint.secret}
                        </div>
                    </div>
                    <DeliveryLogs deliveries={deliveries} loading={deliveriesLoading} />
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
                    Select an endpoint to view logs or create a new one.
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
