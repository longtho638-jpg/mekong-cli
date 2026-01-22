import React, { useState } from 'react';
import { trackingClient } from '../lib/tracking/client';

export const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('general');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          content,
          metadata: {
            url: window.location.href,
            referrer: document.referrer
          }
        })
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setSubmitted(true);
      setContent('');

      // Also track this as a conversion goal
      trackingClient.trackConversion('feedback_submitted', { category });

      // Close after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-24 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 border-bottom border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex justify-between items-center">
            <h3 className="font-bold text-[var(--color-text-primary)]">Send Feedback</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            {submitted ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h4 className="font-bold text-[var(--color-accent-green)]">Thank you!</h4>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">Your feedback helps us build a better AgencyOS.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">Category</label>
                  <div className="flex gap-2">
                    {['general', 'bug', 'feature'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                          category === cat
                          ? 'bg-[var(--color-accent-green)] text-white border-[var(--color-accent-green)]'
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">What's on your mind?</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tell us what you like or what we can improve..."
                    className="w-full h-24 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-green)] transition-all resize-none"
                    required
                  />
                </div>

                {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="w-full py-2.5 bg-[var(--color-accent-green)] text-white rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all hover:scale-110 ${
          isOpen
          ? 'bg-red-500 text-white rotate-90'
          : 'bg-gradient-to-br from-[var(--color-accent-green)] to-[#16a34a] text-white'
        }`}
        aria-label="Feedback"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
};
