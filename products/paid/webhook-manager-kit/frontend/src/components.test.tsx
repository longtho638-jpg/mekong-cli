import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EndpointForm } from './components/EndpointForm';
import { EndpointList } from './components/EndpointList';
import { DeliveryLogs } from './components/DeliveryLogs';
import { WebhookEndpoint, WebhookDelivery } from './types';

describe('EndpointForm', () => {
    it('renders form fields', () => {
        const mockSave = vi.fn();
        const mockCancel = vi.fn();
        render(<EndpointForm onSave={mockSave} onCancel={mockCancel} />);

        expect(screen.getByText('Endpoint URL')).toBeDefined();
        expect(screen.getByText('Description')).toBeDefined();
        expect(screen.getByText('Event Types (comma separated)')).toBeDefined();
    });

    it('submits form data', async () => {
        const mockSave = vi.fn().mockResolvedValue(undefined);
        const mockCancel = vi.fn();
        render(<EndpointForm onSave={mockSave} onCancel={mockCancel} />);

        fireEvent.change(screen.getByPlaceholderText('https://api.yourapp.com/webhooks'), {
            target: { value: 'https://test.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Production Server'), {
            target: { value: 'Test Endpoint' }
        });
        fireEvent.change(screen.getByPlaceholderText('user.created, order.paid'), {
            target: { value: 'test.event' }
        });

        fireEvent.click(screen.getByText('Save Endpoint'));

        await waitFor(() => {
            expect(mockSave).toHaveBeenCalledWith({
                url: 'https://test.com',
                description: 'Test Endpoint',
                event_types: ['test.event'],
                is_active: true
            });
        });
    });
});

describe('EndpointList', () => {
    const mockEndpoints: WebhookEndpoint[] = [
        {
            id: 1,
            url: 'https://test.com',
            description: 'Test Endpoint',
            secret: 'secret123',
            is_active: true,
            event_types: ['test.event'],
            created_at: new Date().toISOString()
        }
    ];

    it('renders endpoints', () => {
        render(
            <EndpointList
                endpoints={mockEndpoints}
                onSelect={() => {}}
                onDelete={() => {}}
                selectedId={null}
                onAdd={() => {}}
            />
        );

        expect(screen.getByText('Test Endpoint')).toBeDefined();
        expect(screen.getByText('https://test.com')).toBeDefined();
        expect(screen.getByText('Events: test.event')).toBeDefined();
    });
});

describe('DeliveryLogs', () => {
    const mockDeliveries: WebhookDelivery[] = [
        {
            id: 1,
            endpoint_id: 1,
            url: 'https://test.com',
            request_headers: {},
            request_body: { event_type: 'test.event' },
            response_status_code: 200,
            success: true,
            attempt: 1,
            created_at: new Date().toISOString()
        }
    ];

    it('renders empty state', () => {
        render(<DeliveryLogs deliveries={[]} loading={false} />);
        expect(screen.getByText('No delivery attempts yet.')).toBeDefined();
    });

    it('renders delivery logs', () => {
        render(<DeliveryLogs deliveries={mockDeliveries} loading={false} />);
        expect(screen.getByText('test.event')).toBeDefined();
        expect(screen.getByText('200')).toBeDefined();
    });
});
