import { useState, useCallback, useRef } from 'react';
import { Operation, OTClient, OpType } from '../utils/ot-client';
import { useWebSocket } from './useWebSocket';
import { usePresence } from './usePresence';
import { useCursors } from './useCursors';

interface UseCollaborativeDocProps {
  wsUrl: string;
  roomId: string;
  userId: string;
  username: string;
  userColor: string;
}

export const useCollaborativeDoc = ({
  wsUrl,
  roomId,
  userId,
  username,
  userColor
}: UseCollaborativeDocProps) => {
  const [content, setContent] = useState<string>('');
  const [revision, setRevision] = useState<number>(0);

  // Pending operations that haven't been acknowledged by server
  const pendingOps = useRef<Operation[]>([]);

  // Hooks
  const { status, sendMessage } = useWebSocket({
    url: wsUrl,
    roomId,
    userId,
    username,
    color: userColor,
    onMessage: (msg) => handleMessage(msg)
  });

  const { users, handlePresenceUpdate, handleTypingUpdate } = usePresence(status);
  const { cursors, handleCursorUpdate } = useCursors();

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'init':
        setContent(message.document);
        setRevision(message.revision);
        handlePresenceUpdate(message.presence);
        break;

      case 'operation':
        if (message.user_id === userId) {
          // Acknowledge our own op
          // Remove from pending
          pendingOps.current.shift();
          setRevision(message.revision);
        } else {
          // Apply remote op
          const incomingOp = message.operation;

          // Transform incoming op against our pending ops
          // Because the incoming op happened concurrently with our pending ops
          let transformedOp = incomingOp;

          for (const pending of pendingOps.current) {
             const [_, serverOpPrime] = OTClient.transform(pending, transformedOp);
             transformedOp = serverOpPrime;
          }

          // Apply transformed op to content
          setContent(prev => OTClient.apply(prev, transformedOp));
          setRevision(message.revision);
        }
        break;

      case 'presence_update':
        handlePresenceUpdate(message.data);
        break;

      case 'cursor_update':
        handleCursorUpdate(message.user_id, message.position);
        break;

      case 'typing_update':
        handleTypingUpdate(message.user_id, message.is_typing);
        break;
    }
  }, [userId, handlePresenceUpdate, handleCursorUpdate, handleTypingUpdate]);

  const submitOperation = useCallback((op: Operation) => {
    // Apply locally immediately (Optimistic UI)
    setContent(prev => OTClient.apply(prev, op));

    // Add to pending
    pendingOps.current.push(op);

    // Send to server
    sendMessage('operation', {
      operation: op,
      revision: revision
    });
  }, [revision, sendMessage]);

  const sendCursor = useCallback((position: number) => {
    sendMessage('cursor', { position });
  }, [sendMessage]);

  const sendTyping = useCallback((isTyping: boolean) => {
    sendMessage('typing', { is_typing: isTyping });
  }, [sendMessage]);

  return {
    content,
    users,
    cursors,
    submitOperation,
    sendCursor,
    sendTyping,
    status
  };
};
