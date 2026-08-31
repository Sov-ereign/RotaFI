import { useEffect, useState } from 'react';
import { MessageSquare, Star, Plus, ThumbsUp, ShieldCheck, Heart, Send } from 'lucide-react';
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
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10 space-y-8">
      {/* Header Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-brand-600 via-sapphire-600 to-indigo-700 text-white shadow-lift relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="badge bg-white/20 text-white backdrop-blur-md">
                <MessageSquare className="h-3 w-3 mr-1" /> Community Feedback
              </span>
              <span className="text-xs text-brand-100">Live Member Reviews</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Community Ratings & Platform Feedback
            </h1>
            <p className="text-sm text-brand-100/90 leading-relaxed">
              Explore reviews and feature requests submitted by onboarded ROSCA participants and committee members across India.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl ring-1 ring-white/20 shrink-0">
            <div className="text-center">
              <div className="font-display text-3xl font-black text-white flex items-center justify-center gap-1">
                {avgRating} <Star className="h-5 w-5 fill-amber-300 text-amber-300 inline" />
              </div>
              <div className="text-[10px] uppercase font-bold text-brand-200 mt-0.5">Average Score</div>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <div className="font-display text-3xl font-black text-white">{feedbacks.length}</div>
              <div className="text-[10px] uppercase font-bold text-brand-200 mt-0.5">Total Reviews</div>
            </div>
          </div>
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
              {cat === 'All' ? 'All Reviews' : cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary btn-sm rounded-full shadow-soft"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" /> Submit Feedback
        </button>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse bg-ink-50 h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">No feedback submitted for this category yet.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <div key={item.id} className="card p-5 hover:shadow-lift transition flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="badge bg-ink-100 text-ink-600 text-[10px]">{item.category}</span>
                </div>
                <p className="text-sm text-ink-800 leading-relaxed font-medium">"{item.comment}"</p>
              </div>

              <div className="pt-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-400">
                <span className="font-semibold text-ink-700">{item.user_name}</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified
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
