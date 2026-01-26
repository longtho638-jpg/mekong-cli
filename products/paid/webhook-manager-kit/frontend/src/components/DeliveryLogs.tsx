import React from 'react';
import { WebhookDelivery } from '../types';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { webhookApi } from '../api/client';

interface Props {
  deliveries: WebhookDelivery[];
  loading: boolean;
}

export const DeliveryLogs: React.FC<Props> = ({ deliveries, loading }) => {
  const [selectedDelivery, setSelectedDelivery] = React.useState<WebhookDelivery | null>(null);
  const [retrying, setRetrying] = React.useState(false);

  const handleRetry = async (id: number) => {
    setRetrying(true);
    try {
      await webhookApi.retryDelivery(id);
      alert('Retry scheduled successfully');
    } catch (error) {
      console.error('Failed to retry', error);
      alert('Failed to schedule retry');
    } finally {
      setRetrying(false);
    }
  };

  if (loading && deliveries.length === 0) {
    return <div className="p-4 text-center text-gray-500">Loading logs...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Delivery Logs</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">History of webhook attempts.</p>
      </div>

      <div className="flex-1 overflow-auto min-h-[400px]">
        {deliveries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No delivery attempts yet.</div>
        ) : (
          <div className="flex h-full">
             {/* List */}
             <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                    {deliveries.map((delivery) => (
                        <li
                            key={delivery.id}
                            className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedDelivery?.id === delivery.id ? 'bg-indigo-50' : ''}`}
                            onClick={() => setSelectedDelivery(delivery)}
                        >
                            <div className="flex items-center space-x-3">
                                {delivery.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {delivery.request_body?.event_type || 'Unknown Event'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(delivery.created_at), 'MMM d, HH:mm:ss')}
                                    </p>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                    <span className={`px-2 py-0.5 rounded-full ${delivery.response_status_code && delivery.response_status_code >= 200 && delivery.response_status_code < 300 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {delivery.response_status_code || '---'}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
             </div>

             {/* Details */}
             <div className="w-2/3 p-6 overflow-y-auto bg-gray-50">
                {selectedDelivery ? (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Request Details</h4>
                            <div className="mt-2 bg-white rounded-md border border-gray-200 p-4 font-mono text-xs overflow-x-auto">
                                <p className="mb-2"><span className="font-bold">ID:</span> {selectedDelivery.id}</p>
                                <p className="mb-2"><span className="font-bold">Attempt:</span> {selectedDelivery.attempt}</p>
                                <p className="mb-2"><span className="font-bold">Duration:</span> {selectedDelivery.duration_ms}ms</p>
                                <p className="mb-2 text-gray-400">Headers:</p>
                                <pre className="mb-4">{JSON.stringify(selectedDelivery.request_headers, null, 2)}</pre>
                                <p className="mb-2 text-gray-400">Payload:</p>
                                <pre>{JSON.stringify(selectedDelivery.request_body, null, 2)}</pre>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Response Details</h4>
                            <div className="mt-2 bg-white rounded-md border border-gray-200 p-4 font-mono text-xs overflow-x-auto">
                                <p className="mb-2"><span className="font-bold">Status:</span> {selectedDelivery.response_status_code}</p>
                                {selectedDelivery.error_message && (
                                    <p className="mb-2 text-red-600"><span className="font-bold">Error:</span> {selectedDelivery.error_message}</p>
                                )}
                                <p className="mb-2 text-gray-400">Body:</p>
                                <pre>{selectedDelivery.response_body || '(No body)'}</pre>
                            </div>
                        </div>

                        {selectedDelivery.next_retry_at && !selectedDelivery.success && (
                            <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
                                <Clock className="h-4 w-4 mr-2" />
                                Next retry at: {format(new Date(selectedDelivery.next_retry_at), 'MMM d, HH:mm:ss')}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        Select a delivery to view details
                    </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
