'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function CreateMissionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const openModal = () => {
    setIsOpen(true);
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    setIsOpen(false);
    dialogRef.current?.close();
    setTitle('');
    setStatus('TODO');
    setPriority('MEDIUM');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status, priority }),
      });

      const data = await res.json();
      if (data.success) {
        closeModal();
        router.refresh(); // Refresh server component data
      } else {
        alert(`Error: ${data.error.message}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error';
      alert(`Failed to create mission: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
      >
        + Create Mission
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-lg shadow-xl p-0 backdrop:bg-black backdrop:bg-opacity-50"
        onClose={() => setIsOpen(false)}
      >
        <div className="bg-white rounded-lg p-6 w-[500px]">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎯 Tạo Mission Mới
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter mission title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'TODO' | 'IN_PROGRESS' | 'DONE')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </div>

            {/* Priority */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
