import React, { useState } from 'react';
import { MessageSquare, X, Camera, Star, Loader2, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useFeedback, FeedbackData } from '../hooks/useFeedback';
import { AnnotationEditor } from './AnnotationEditor';
import '../index.css';

export interface FeedbackWidgetProps {
  apiEndpoint?: string;
  apiKey?: string;
  onSubmit?: (data: FeedbackData) => Promise<void>;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  apiEndpoint,
  apiKey,
  onSubmit,
  primaryColor = '#2563eb', // blue-600
  position = 'bottom-right',
}) => {
  const { isOpen, toggle, isSubmitting, error, success, submitFeedback } = useFeedback({
    apiEndpoint,
    apiKey,
    onSubmit,
  });

  const [type, setType] = useState<FeedbackData['type']>('general');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [tempScreenshot, setTempScreenshot] = useState<string | null>(null);

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      // Hide widget temporarily to not include it in screenshot
      const widgetElement = document.getElementById('feedback-widget-container');
      if (widgetElement) widgetElement.style.opacity = '0';

      const canvas = await html2canvas(document.body);
      const dataUrl = canvas.toDataURL('image/png');

      setTempScreenshot(dataUrl);
      setIsAnnotating(true);

      if (widgetElement) widgetElement.style.opacity = '1';
    } catch (e) {
      console.error('Screenshot failed', e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAnnotationSave = (editedUrl: string) => {
    setScreenshot(editedUrl);
    setIsAnnotating(false);
    setTempScreenshot(null);
  };

  const handleAnnotationCancel = () => {
    setIsAnnotating(false);
    setTempScreenshot(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback({
      type,
      content,
      rating,
      screenshot,
    });
  };

  const positionClasses = position === 'bottom-right' ? 'right-6' : 'left-6';

  return (
    <>
      {isAnnotating && tempScreenshot && (
        <AnnotationEditor
          screenshotUrl={tempScreenshot}
          onSave={handleAnnotationSave}
          onCancel={handleAnnotationCancel}
        />
      )}

      <div id="feedback-widget-container" className="font-sans antialiased">
        <AnimatePresence>
          {isOpen && !isAnnotating && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={twMerge(
                "fixed bottom-24 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[9999]",
                positionClasses
              )}
            >
              {success ? (
                <div className="flex flex-col items-center justify-center h-64 p-6 text-center text-green-600">
                  <CheckCircle2 size={48} className="mb-4" />
                  <h3 className="text-lg font-semibold">Thank you!</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Your feedback has been received.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[600px]">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Send Feedback</h3>
                    <button
                      type="button"
                      onClick={toggle}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Feedback Type */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      {(['general', 'bug', 'feature'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={twMerge(
                            "flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
                            type === t
                              ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Rating */}
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            size={24}
                            className={clsx(
                              rating >= star ? "fill-yellow-400 text-yellow-400" : "text-slate-300 dark:text-slate-700"
                            )}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Content */}
                    <textarea
                      required
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tell us what you think..."
                      className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none dark:text-white placeholder:text-slate-400"
                    />

                    {/* Screenshot */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Screenshot (optional)</span>
                        {!screenshot && (
                          <button
                            type="button"
                            onClick={handleCapture}
                            disabled={isCapturing}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                          >
                            {isCapturing ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                            Capture Screen
                          </button>
                        )}
                      </div>

                      {screenshot && (
                        <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                          <img src={screenshot} alt="Screenshot" className="w-full h-auto" />
                          <button
                            type="button"
                            onClick={() => setScreenshot(null)}
                            className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {error && (
                      <p className="text-xs text-red-500">{error}</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <button
                      type="submit"
                      disabled={isSubmitting || !content}
                      style={{ backgroundColor: primaryColor }}
                      className="w-full py-2 px-4 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                      Submit Feedback
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggle}
          style={{ backgroundColor: primaryColor }}
          className={twMerge(
            "fixed w-14 h-14 rounded-full shadow-lg hover:shadow-xl text-white flex items-center justify-center transition-all hover:scale-105 z-[9998]",
            positionClasses,
            isOpen ? "rotate-90 bottom-6" : "rotate-0 bottom-6"
          )}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
      </div>
    </>
  );
};
