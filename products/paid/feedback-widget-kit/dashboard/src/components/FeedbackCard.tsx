import React, { useState } from 'react';
import { Feedback, FeedbackStatus } from '../types';
import { updateFeedbackStatus, deleteFeedback } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bug,
  Lightbulb,
  MessageSquare,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Monitor,
  Globe
} from 'lucide-react';
import { clsx } from 'clsx';

interface FeedbackCardProps {
  feedback: Feedback;
}

const statusColors: Record<FeedbackStatus, string> = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'bug': return <Bug size={16} className="text-red-500" />;
    case 'feature': return <Lightbulb size={16} className="text-yellow-500" />;
    default: return <MessageSquare size={16} className="text-blue-500" />;
  }
};

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback }) => {
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (status: FeedbackStatus) => updateFeedbackStatus(feedback.id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedbacks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFeedback(feedback.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedbacks'] }),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const API_BASE = 'http://localhost:8000'; // Should be env var

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className={clsx("p-1.5 rounded-md bg-slate-50 border border-slate-100")}>
            <TypeIcon type={feedback.type} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 capitalize">{feedback.type}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{formatDate(feedback.created_at)}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={clsx("text-xs", i < feedback.rating ? "text-yellow-400" : "text-slate-200")}>★</span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
              <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Set Status</div>
              {(['open', 'in_progress', 'resolved', 'closed'] as FeedbackStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => { updateMutation.mutate(status); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 capitalize text-slate-700 flex items-center gap-2"
                >
                  {status === feedback.status && <CheckCircle size={12} className="text-green-500" />}
                  {status.replace('_', ' ')}
                </button>
              ))}
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={() => { deleteMutation.mutate(); setShowMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
        {feedback.content}
      </p>

      {/* Metadata Badges */}
      <div className="flex flex-wrap gap-2 mt-auto">
        <span className={clsx("px-2 py-1 rounded-full text-xs font-medium border capitalize", statusColors[feedback.status])}>
          {feedback.status.replace('_', ' ')}
        </span>

        {feedback.metadata_info?.url && (
          <a href={feedback.metadata_info.url} target="_blank" rel="noreferrer"
             className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 hover:bg-slate-200 truncate max-w-[150px]">
            <Globe size={10} /> {new URL(feedback.metadata_info.url).pathname}
          </a>
        )}

        {feedback.metadata_info?.screenSize && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
            <Monitor size={10} /> {feedback.metadata_info.screenSize}
          </span>
        )}
      </div>

      {/* Screenshot */}
      {feedback.screenshot_url && (
        <div className="mt-2">
          <button
            onClick={() => setShowScreenshot(true)}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <ExternalLink size={12} /> View Screenshot
          </button>
        </div>
      )}

      {/* Lightbox for Screenshot */}
      {showScreenshot && feedback.screenshot_url && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setShowScreenshot(false)}
        >
          <img
            src={`${API_BASE}${feedback.screenshot_url}`}
            alt="Feedback Screenshot"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setShowScreenshot(false)}
          >
            <XCircle size={32} />
          </button>
        </div>
      )}
    </div>
  );
};
