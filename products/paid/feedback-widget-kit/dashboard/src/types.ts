export type FeedbackType = 'bug' | 'feature' | 'general';
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Feedback {
  id: number;
  type: FeedbackType;
  content: string;
  rating: number;
  screenshot_url?: string;
  metadata_info?: Record<string, any>;
  status: FeedbackStatus;
  created_at: string;
}
