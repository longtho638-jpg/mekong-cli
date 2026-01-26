import { useState, useEffect } from 'react';
import { webhookApi } from '../api/client';
import { WebhookEndpoint, WebhookDelivery } from '../types';

export const useWebhooks = () => {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    setLoading(true);
    try {
      const data = await webhookApi.getEndpoints();
      setEndpoints(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch endpoints');
    } finally {
      setLoading(false);
    }
  };

  const createEndpoint = async (data: any) => {
    try {
      await webhookApi.createEndpoint(data);
      await fetchEndpoints();
    } catch (err: any) {
      throw err;
    }
  };

  const deleteEndpoint = async (id: number) => {
      try {
          await webhookApi.deleteEndpoint(id);
          await fetchEndpoints();
      } catch (err: any) {
          throw err;
      }
  }

  useEffect(() => {
    fetchEndpoints();
  }, []);

  return { endpoints, loading, error, fetchEndpoints, createEndpoint, deleteEndpoint };
};

export const useDeliveries = (endpointId: number | null) => {
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDeliveries = async () => {
        if (!endpointId) return;
        setLoading(true);
        try {
            const data = await webhookApi.getDeliveries(endpointId);
            setDeliveries(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
        // Poll every 5 seconds if viewing logs
        const interval = setInterval(fetchDeliveries, 5000);
        return () => clearInterval(interval);
    }, [endpointId]);

    return { deliveries, loading, fetchDeliveries };
};
