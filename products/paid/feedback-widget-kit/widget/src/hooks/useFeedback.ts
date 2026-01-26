import { useState } from 'react';

export interface FeedbackData {
  type: 'bug' | 'feature' | 'general';
  content: string;
  rating: number;
  screenshot?: string | null;
  metadata?: Record<string, any>;
}

interface UseFeedbackProps {
  apiEndpoint?: string;
  apiKey?: string;
  onSubmit?: (data: FeedbackData) => Promise<void>;
}

export const useFeedback = ({ apiEndpoint, apiKey, onSubmit }: UseFeedbackProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  const submitFeedback = async (data: FeedbackData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Capture metadata automatically
      const metadata = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        ...data.metadata,
      };

      const finalData = { ...data, metadata };

      if (onSubmit) {
        await onSubmit(finalData);
      } else if (apiEndpoint) {
        const formData = new FormData();
        formData.append('type', finalData.type);
        formData.append('content', finalData.content);
        formData.append('rating', finalData.rating.toString());
        formData.append('metadata', JSON.stringify(finalData.metadata));

        if (finalData.screenshot) {
          // Convert base64 to blob if needed, or send as string depending on backend
          // For now sending as string field or we can process base64 to blob here
          // Let's assume backend accepts base64 string or file.
          // Standard way is usually file, let's convert base64 to blob
          const res = await fetch(finalData.screenshot);
          const blob = await res.blob();
          formData.append('screenshot', blob, 'screenshot.png');
        }

        const headers: HeadersInit = {};
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to submit feedback');
        }
      } else {
        console.warn('No apiEndpoint or onSubmit provided for FeedbackWidget');
        // Simulate success for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        close();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isOpen,
    isSubmitting,
    error,
    success,
    toggle,
    close,
    open,
    submitFeedback,
  };
};
