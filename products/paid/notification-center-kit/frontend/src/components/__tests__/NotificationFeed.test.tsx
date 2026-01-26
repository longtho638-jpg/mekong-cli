import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationFeed } from '../NotificationFeed';
import { useNotifications } from '../../hooks/useNotifications';

// Mock the hook
vi.mock('../../hooks/useNotifications');

describe('NotificationFeed Component', () => {
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();

  it('renders the bell icon with badge count', () => {
    // @ts-ignore
    useNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 3,
      isConnected: true,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<NotificationFeed userId="user1" />);

    // Check for bell icon (using basic query or aria-label if we added it, assuming SVG presence)
    // Checking for badge count
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows notifications when clicked', () => {
    // @ts-ignore
    useNotifications.mockReturnValue({
      notifications: [
        { id: 1, title: 'Test Notif', body: 'Body text', is_read: false, created_at: new Date().toISOString() }
      ],
      unreadCount: 1,
      isConnected: true,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<NotificationFeed userId="user1" />);

    // Click button (assuming it's the first button)
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Test Notif')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('calls markAsRead when clicking unread indicator', () => {
     // @ts-ignore
     useNotifications.mockReturnValue({
        notifications: [
          { id: 1, title: 'Test Notif', body: 'Body text', is_read: false, created_at: new Date().toISOString() }
        ],
        unreadCount: 1,
        isConnected: true,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
      });

      render(<NotificationFeed userId="user1" />);
      fireEvent.click(screen.getByRole('button')); // Open dropdown

      // Find mark as read button (it has title="Mark as read")
      const markReadBtn = screen.getByTitle('Mark as read');
      fireEvent.click(markReadBtn);

      expect(mockMarkAsRead).toHaveBeenCalledWith(1);
  });
});
