import { useState } from 'react';
import { Trophy, ArrowUp, ArrowDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { avatarGradient, initials } from '../lib/wallet';
import { useApp } from '../context/AppContext';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  subtitle: string;
  score: string;
  delta: string;
  movement: 'up' | 'down' | 'same';
  placesMoved?: number;
  wallet_address?: string;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  title?: string;
  periodLabel?: string;
  entries?: LeaderboardEntry[];
  currentUserRank?: number;
  totalMembers?: number;
  onViewFullTable?: () => void;
}

const DEFAULT_ENTRIES: LeaderboardEntry[] = [
  { id: '1', rank: 1, name: 'Aarav Sharma', subtitle: 'Mumbai Savings Guild · Organizer', score: '820 PTS', delta: '+45 pts this week', movement: 'up', placesMoved: 2 },
  { id: '2', rank: 2, name: 'Priya Patel', subtitle: 'Gujarat ROSCA Circle · Member', score: '795 PTS', delta: '+20 pts this week', movement: 'same' },
  { id: '3', rank: 3, name: 'Sovereign', subtitle: 'Stellar Soroban Vault · Member', score: '780 PTS', delta: '+65 pts this week', movement: 'up', placesMoved: 3, isCurrentUser: true },
  { id: '4', rank: 4, name: 'Rishabh Rastogi', subtitle: 'Delhi Capital Chit Fund · Member', score: '750 PTS', delta: '-10 pts this week', movement: 'down', placesMoved: 1 },
  { id: '5', rank: 5, name: 'Meena Iyer', subtitle: 'Chennai South SHG · Organizer', score: '735 PTS', delta: '+15 pts this week', movement: 'up', placesMoved: 1 },
  { id: '6', rank: 6, name: 'Vivek Singhania', subtitle: 'Kolkata Traders Pool · Member', score: '710 PTS', delta: '0 pts this week', movement: 'same' },
  { id: '7', rank: 7, name: 'Aakanksha Tyagi', subtitle: 'Bangalore Tech Circle · Member', score: '695 PTS', delta: '+30 pts this week', movement: 'up', placesMoved: 4 },
  { id: '8', rank: 8, name: 'Arjun Verma', subtitle: 'Pune Informal Savings · Member', score: '680 PTS', delta: '-15 pts this week', movement: 'down', placesMoved: 2 },
  { id: '9', rank: 9, name: 'Preeti Somani', subtitle: 'Jaipur Heritage Guild · Member', score: '665 PTS', delta: '+5 pts this week', movement: 'same' },
  { id: '10', rank: 10, name: 'Isha Chawla', subtitle: 'Hyderabad Women Collectives · Member', score: '650 PTS', delta: '-5 pts this week', movement: 'down', placesMoved: 1 },
];

export function Leaderboard({
  title = 'Reputation Credit Leaderboard',
  periodLabel = 'Updated real-time on Stellar Testnet',
  entries = DEFAULT_ENTRIES,
  currentUserRank = 3,
  totalMembers = 50,
  onViewFullTable,
}: LeaderboardProps) {
  const { theme } = useApp();
  const [period, setPeriod] = useState<'week' | 'all'>('week');

  return (
    <div className={`overflow-hidden rounded-2xl transition-all duration-300 ${
      theme === 'dark'
        ? 'liquid-glass bg-slate-900/80 border border-white/10 text-white shadow-2xl'
        : 'card bg-white border border-slate-200/90 shadow-sm text-slate-900'
    }`}>
      {/* Card Header: Title + Period Label + Segmented Control */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b px-6 py-4 transition-colors ${
        theme === 'dark' ? 'bg-slate-950/80 border-white/10' : 'bg-slate-50 border-slate-200/80'
      }`}>
        <div className="space-y-0.5">
          <h3 className={`font-display text-base font-black flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            <Trophy className="h-4.5 w-4.5 text-amber-500" /> {title}
          </h3>
          <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{periodLabel}</p>
        </div>

        {/* Small Segmented Control */}
        <div className={`inline-flex items-center rounded-full p-1 text-xs font-bold border self-start sm:self-auto ${
          theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-slate-200/80 border-slate-300/60'
        }`}>
          <button
            onClick={() => setPeriod('week')}
            className={`rounded-full px-3 py-1 transition-all duration-200 ${
              period === 'week'
                ? theme === 'dark' ? 'bg-white text-black font-black shadow-md' : 'bg-white text-slate-900 shadow-sm'
                : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This week
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`rounded-full px-3 py-1 transition-all duration-200 ${
              period === 'all'
                ? theme === 'dark' ? 'bg-white text-black font-black shadow-md' : 'bg-white text-slate-900 shadow-sm'
                : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All time
          </button>
        </div>
      </div>

      {/* Ten Rows divided by Hairlines */}
      <div className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
        {entries.slice(0, 10).map((entry) => {
          const isTop1 = entry.rank === 1;
          const isTop2 = entry.rank === 2;
          const isTop3 = entry.rank === 3;
          const isTopThree = isTop1 || isTop2 || isTop3;
          const isUser = entry.isCurrentUser;

          // Medal dot colors
          const medalDotColor = isTop1
            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
            : isTop2
            ? 'bg-slate-300'
            : isTop3
            ? 'bg-amber-600'
            : '';

          // Row background tint
          const rowBgClass = isUser
            ? theme === 'dark'
              ? 'border-l-4 border-emerald-400 bg-emerald-500/10 font-medium'
              : 'border-l-4 border-slate-900 bg-slate-50/90 font-medium'
            : isTop1
            ? theme === 'dark' ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'bg-amber-50/30 hover:bg-amber-50/50'
            : isTop2
            ? theme === 'dark' ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-slate-50/50 hover:bg-slate-50/80'
            : isTop3
            ? theme === 'dark' ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'bg-amber-50/20 hover:bg-amber-50/40'
            : theme === 'dark' ? 'hover:bg-white/5' : 'bg-white hover:bg-slate-50/60';

          return (
            <div
              key={entry.id}
              className={`flex items-center justify-between px-5 py-3.5 transition-colors ${rowBgClass}`}
            >
              {/* Left Group: Rank, Medal Dot, Movement Indicator, Avatar, Name & Team */}
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Rank with Medal Dot */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isTopThree && (
                    <span className={`h-2 w-2 rounded-full ${medalDotColor}`} />
                  )}
                  <span className={`font-mono text-xs font-bold w-5 text-center ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    #{entry.rank}
                  </span>
                </div>

                {/* Movement Indicator */}
                <div className="w-9 shrink-0 flex items-center justify-center font-mono text-[11px] font-bold">
                  {entry.movement === 'up' && (
                    <span className={`flex items-center ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      <ArrowUp className="h-3 w-3 mr-0.5" />+{entry.placesMoved ?? 1}
                    </span>
                  )}
                  {entry.movement === 'down' && (
                    <span className="flex items-center text-red-500">
                      <ArrowDown className="h-3 w-3 mr-0.5" />-{entry.placesMoved ?? 1}
                    </span>
                  )}
                  {entry.movement === 'same' && (
                    <span className="text-slate-500 font-bold">-</span>
                  )}
                </div>

                {/* Avatar Circle */}
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-white shadow-sm ring-2 ring-white/20"
                  style={{ background: avatarGradient(entry.wallet_address || entry.name) }}
                >
                  {initials(entry.name)}
                </div>

                {/* Name & Muted Team/Role Line */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`truncate text-xs sm:text-sm font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {entry.name}
                    </span>
                    {isUser && (
                      <span className={`rounded-full text-[10px] font-extrabold px-2 py-0.5 shadow-sm ${
                        theme === 'dark' ? 'bg-emerald-400 text-black' : 'bg-slate-900 text-white'
                      }`}>
                        You
                      </span>
                    )}
                  </div>
                  <p className={`truncate text-[11px] font-medium ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {entry.subtitle}
                  </p>
                </div>
              </div>

              {/* Right-aligned Monospace Score & Tiny Delta */}
              <div className="text-right shrink-0 pl-3">
                <div className={`font-mono text-xs sm:text-sm font-black tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {entry.score}
                </div>
                <div className={`font-mono text-[10px] font-bold mt-0.5 ${
                  theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  {entry.delta}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Strip */}
      <div className={`flex items-center justify-between border-t px-6 py-3.5 text-xs font-medium transition-colors ${
        theme === 'dark' ? 'bg-slate-950/80 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className={`h-3.5 w-3.5 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <span>Your Rank: <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-slate-900 font-bold'}>#{currentUserRank}</strong> out of {totalMembers} members</span>
        </div>
        {onViewFullTable && (
          <button
            onClick={onViewFullTable}
            className={`inline-flex items-center gap-1 font-bold transition ${
              theme === 'dark' ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
            }`}
          >
            Full Table <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
