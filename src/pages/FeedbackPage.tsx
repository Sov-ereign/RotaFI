import { useEffect, useState } from 'react';
import { MessageSquare, Star, Plus, ThumbsUp, ShieldCheck, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchFeedbackList } from '../lib/contract';
import type { FeedbackItem } from '../lib/types';
import { FeedbackModal } from '../components/FeedbackModal';

export function FeedbackPage() {
  const { identity, navigate } = useApp();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFeedbacks = () => {
    setLoading(true);
    fetchFeedbackList()
      .then((items) => setFeedbacks(items))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const categories = ['All', 'UI/UX', 'Features', 'Smart Contracts', 'General'];

  const filtered = activeCategory === 'All'
    ? feedbacks
    : feedbacks.filter((f) => f.category === activeCategory);

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : '5.0';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-brand-600 via-sapphire-600 to-indigo-700 text-white shadow-lift relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="badge bg-white/20 text-white backdrop-blur-md">
                <MessageSquare className="h-3 w-3 mr-1" /> Community Feedback
              </span>
              <span className="badge bg-amber-400 text-ink-950 font-bold">
                ★ {avgRating} / 5.0 Rating
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              User Reviews & Platform Feedback
            </h1>
            <p className="text-sm text-brand-50/90 leading-relaxed">
              Explore authentic feedback submitted by RotaFi members, ROSCA participants, and committee organizers.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-lg bg-white text-brand-700 font-bold hover:bg-brand-50 shadow-soft shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Give Platform Feedback
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-ink-150 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'bg-ink-100/70 text-ink-600 hover:bg-ink-200/70'
              }`}
            >
              {cat} {cat === 'All' ? `(${feedbacks.length})` : ''}
            </button>
          ))}
        </div>

        <span className="text-xs text-ink-400 font-medium">
          Showing {filtered.length} verified reviews
        </span>
      </div>

      {/* Feedback Grid */}
      {loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <MessageSquare className="h-10 w-10 text-ink-300 mx-auto" />
          <p className="font-semibold text-ink-800">No feedback submitted in this category yet.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary btn-sm">
            Be the first to leave a review
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((fb) => (
            <div key={fb.id} className="card p-5 bg-white space-y-3 flex flex-col justify-between hover:shadow-lift transition">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}`}
                      />
                    ))}
                  </div>
                  <span className="badge text-[10px] font-bold bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                    {fb.category}
                  </span>
                </div>
                <p className="text-xs text-ink-700 leading-relaxed italic">"{fb.comment}"</p>
              </div>

              <div className="pt-3 border-t border-ink-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-ink-900 block">{fb.user_name}</span>
                  <span className="text-[10px] text-ink-400 block">
                    {new Date(fb.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <span className="badge bg-emerald-50 text-emerald-700 text-[10px]">
                  <ShieldCheck className="h-3 w-3 mr-0.5" /> Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitted={loadFeedbacks}
      />
    </div>
  );
}
