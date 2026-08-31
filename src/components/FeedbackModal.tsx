import { useState } from 'react';
import { Star, MessageSquare, Loader2, Send } from 'lucide-react';
import { Modal } from './Modal';
import { useApp } from '../context/AppContext';
import { submitFeedback } from '../lib/contract';

export function FeedbackModal({
  isOpen,
  onClose,
  onSubmitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const { identity, toast } = useApp();
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<'UI/UX' | 'Features' | 'Smart Contracts' | 'General'>('UI/UX');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast({ kind: 'error', title: 'Comment required', description: 'Please enter your feedback comments.' });
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback(rating, category, comment.trim());
      toast({ kind: 'success', title: 'Feedback Submitted!', description: 'Thank you for rating RotaFi.' });
      setComment('');
      setRating(5);
      onClose();
      if (onSubmitted) onSubmitted();
    } catch (err) {
      toast({ kind: 'error', title: 'Submission failed', description: err instanceof Error ? err.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Submit Platform Feedback">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label text-xs">Rating</label>
          <div className="flex items-center gap-1.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 transition hover:scale-110"
              >
                <Star
                  className={`h-7 w-7 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-bold text-ink-800">{rating} / 5</span>
          </div>
        </div>

        <div>
          <label className="label text-xs">Category</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(['UI/UX', 'Features', 'Smart Contracts', 'General'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-lg py-2 text-xs font-semibold border transition ${
                  category === cat
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                    : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label text-xs">Your Feedback / Review</label>
          <textarea
            className="input min-h-[90px] text-xs resize-none"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience using RotaFi committees, bidding, or wallet transfers..."
            maxLength={500}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
          <button type="button" onClick={onClose} className="btn-ghost btn-sm">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !identity} className="btn-primary btn-sm">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="h-4 w-4" /> Submit Feedback</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
