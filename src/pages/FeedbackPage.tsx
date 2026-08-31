import { useEffect, useState } from 'react';
import { MessageSquare, Star, Plus, ShieldCheck, Heart, Send, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchFeedbackList } from '../lib/contract';
import type { FeedbackItem } from '../lib/types';
import { FeedbackModal } from '../components/FeedbackModal';
import { avatarGradient, initials } from '../lib/wallet';

export function FeedbackPage() {
  const { identity, theme } = useApp();
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
    <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-10 space-y-10">
      {/* Centered Heading & Muted Subline */}
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${
          theme === 'dark'
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
        }`}>
          <Sparkles className="h-3.5 w-3.5" />
          Community Reviews & Testimonials
        </div>
        <h1 className={`font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          What Our Onboarded Savers Say
        </h1>
        <p className={`text-base sm:text-lg leading-relaxed text-pretty ${
          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
        }`}>
          Authentic feedback & platform reviews collected from verified ROSCA committee members, organizers, and informal savers across South Asia.
        </p>

        {/* Aggregate Stats Pill & Action Button */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <div className={`flex items-center gap-2 rounded-full px-5 py-2 shadow-sm border ${
            theme === 'dark' ? 'bg-slate-900/80 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <span className={`font-display text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{avgRating}</span>
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <span className={`text-xs font-semibold ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>({feedbacks.length} verified reviews)</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className={`rounded-full px-6 py-2.5 text-xs font-bold shadow-md hover:scale-105 transition-all flex items-center gap-2 ${
              theme === 'dark' ? 'bg-white text-black font-black' : 'btn-primary'
            }`}
          >
            <Send className="h-4 w-4" /> Write a Review
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex justify-center">
        <div className={`inline-flex items-center gap-1.5 rounded-full p-1.5 border backdrop-blur-md ${
          theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-slate-200/70 border-slate-300/60'
        }`}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeCategory === cat
                  ? theme === 'dark' ? 'bg-white text-black font-black shadow-md' : 'bg-slate-900 text-white shadow-md'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'All' ? 'All Reviews' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry Testimonial Wall using CSS Columns */}
      {loading ? (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid card p-6 animate-pulse bg-slate-100 h-48 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-lg mx-auto space-y-3">
          <MessageSquare className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="font-display text-lg font-bold text-slate-900">No reviews found in this category</h3>
          <p className="text-xs text-slate-500">Be the first to submit a review for this category!</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary rounded-full px-5 py-2 text-xs font-bold shadow-sm"
          >
            Write a Review
          </button>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {filtered.map((item, index) => {
            const isDark = index % 2 === 1;
            return (
              <div
                key={item.id}
                className={`break-inside-avoid group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 ${
                  isDark
                    ? 'bg-slate-950 text-white border border-slate-800 shadow-xl'
                    : 'bg-white/95 text-slate-900 border border-slate-200/90 shadow-md hover:shadow-xl'
                }`}
              >
                {/* Top Accent Line */}
                <div
                  className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
                    isDark
                      ? 'from-emerald-400 via-sky-400 to-amber-400'
                      : 'from-emerald-500 via-sky-500 to-indigo-500'
                  } opacity-80 group-hover:opacity-100 transition`}
                />

                {/* Rating & Category */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= item.rating
                            ? 'fill-amber-400 text-amber-400'
                            : isDark ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>

                {/* Quote Body */}
                <p className={`text-sm sm:text-base leading-relaxed font-medium mb-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  "{item.comment}"
                </p>

                {/* Author Row */}
                <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-9 w-9 place-items-center rounded-full text-xs font-black text-white shadow-md ring-2 ring-white/20"
                      style={{ background: avatarGradient(item.user_name) }}
                    >
                      {initials(item.user_name)}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.user_name}
                      </h4>
                      <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        ROSCA Member
                      </p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback Submission Modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitted={loadFeedbacks}
      />
    </div>
  );
}
