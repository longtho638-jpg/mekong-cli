import React, { useRef, useCallback } from 'react';
import { useCollaborativeDoc } from '../hooks/useCollaborativeDoc';
import { PresenceList } from './PresenceList';
import { OpType } from '../utils/ot-client';

// Simple text area based editor for demonstration
// In production, you'd use a more robust cursor/selection handling approach
// or a library wrapper (like textarea-caret) to map index to pixels for cursors.

interface CollaborativeEditorProps {
  wsUrl: string;
  roomId: string;
  userId: string;
  username: string;
  userColor: string;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = (props) => {
  const {
    content,
    users,
    cursors,
    submitOperation,
    sendCursor,
    sendTyping,
    status
  } = useCollaborativeDoc(props);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const oldContent = content;

    // Naive diffing to find operation
    // This only supports single contiguous change (insert or delete) per event
    let start = 0;
    while (start < oldContent.length && start < newContent.length && oldContent[start] === newContent[start]) {
      start++;
    }

    let oldEnd = oldContent.length - 1;
    let newEnd = newContent.length - 1;

    while (oldEnd >= start && newEnd >= start && oldContent[oldEnd] === newContent[newEnd]) {
      oldEnd--;
      newEnd--;
    }

    const insertedText = newContent.slice(start, newEnd + 1);
    const deletedLength = oldEnd - start + 1;

    if (deletedLength > 0) {
      submitOperation({
        type: OpType.DELETE,
        position: start,
        length: deletedLength
      });
    }

    if (insertedText.length > 0) {
      submitOperation({
        type: OpType.INSERT,
        position: start,
        value: insertedText,
        length: insertedText.length
      });
    }

    sendTyping(true);
    setTimeout(() => sendTyping(false), 1000);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    sendCursor(target.selectionStart);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 border rounded shadow-sm bg-white">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold">Room: {props.roomId}</h2>
        <div className="flex items-center space-x-4">
          <div className={`text-sm ${status === 'connected' ? 'text-green-600' : 'text-red-500'}`}>
            {status}
          </div>
          <PresenceList users={users} currentUserId={props.userId} />
        </div>
      </div>

      <div className="relative flex-grow min-h-[500px]">
        {/* Remote Cursors Overlay */}
        {/* Note: Mapping simple index to pixel coordinates in a raw textarea is tricky without a helper lib.
            For this demo, we'll just list them or attempt a naive overlay if possible.
            Given strict constraints, we'll skip complex coordinate mapping and just show the editor logic.
            Ideally, use a ContentEditable or a lib like 'textarea-caret-position'.
        */}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onSelect={handleSelect}
          className="w-full h-full p-4 border rounded font-mono text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Start collaborating..."
          disabled={status !== 'connected'}
        />
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Active Users: {users.length} | Cursors: {cursors.size}
      </div>
    </div>
  );
};
