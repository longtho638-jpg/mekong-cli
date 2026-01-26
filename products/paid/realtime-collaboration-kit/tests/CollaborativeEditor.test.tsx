import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollaborativeEditor } from '../frontend/components/CollaborativeEditor';
import { useCollaborativeDoc } from '../frontend/hooks/useCollaborativeDoc';

// Mock the hook
jest.mock('../frontend/hooks/useCollaborativeDoc');

describe('CollaborativeEditor', () => {
  const mockSubmitOperation = jest.fn();
  const mockSendCursor = jest.fn();
  const mockSendTyping = jest.fn();

  beforeEach(() => {
    (useCollaborativeDoc as jest.Mock).mockReturnValue({
      content: 'Initial content',
      users: [
        { user_id: '1', username: 'Alice', color: 'red', status: 'online', is_typing: false },
        { user_id: '2', username: 'Bob', color: 'blue', status: 'online', is_typing: true }
      ],
      cursors: new Map([['2', 5]]),
      submitOperation: mockSubmitOperation,
      sendCursor: mockSendCursor,
      sendTyping: mockSendTyping,
      status: 'connected'
    });
  });

  test('renders editor with content and users', () => {
    render(
      <CollaborativeEditor
        wsUrl="ws://test"
        roomId="room1"
        userId="1"
        username="Alice"
        userColor="red"
      />
    );

    expect(screen.getByRole('textbox')).toHaveValue('Initial content');
    expect(screen.getByTitle(/Alice/)).toBeInTheDocument();
    expect(screen.getByTitle(/Bob/)).toBeInTheDocument();
  });

  test('updates content and submits operation on change', () => {
    render(
      <CollaborativeEditor
        wsUrl="ws://test"
        roomId="room1"
        userId="1"
        username="Alice"
        userColor="red"
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Initial content changed' } });

    // Verify hook calls (OT logic inside component handles diffing)
    expect(mockSubmitOperation).toHaveBeenCalled();
    expect(mockSendTyping).toHaveBeenCalledWith(true);
  });
});
