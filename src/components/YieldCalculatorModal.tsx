import { useState } from 'react';
import { Calculator, TrendingUp, Sparkles, Coins, ArrowRight, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';

export function YieldCalculatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [monthlyContribution, setMonthlyContribution] = useState(5000);
  const [memberCount, setMemberCount] = useState(10);
  const [bidDiscountPct, setBidDiscountPct] = useState(8);

  const totalPotPerCycle = monthlyContribution * memberCount;
  const totalUserInvestment = monthlyContribution * memberCount;
  
  // Dividend Earnings from Bidding Discounts
  const averageWinningDiscount = totalPotPerCycle * (bidDiscountPct / 100);
  const totalDividendDivided = averageWinningDiscount / (memberCount - 1);
  const estimatedSavingsDividend = totalDividendDivided * (memberCount - 1);
  
  // Stellar Yield Vault Boost (+4.8% APY)
  const stellarYieldBoost = totalUserInvestment * 0.048;
  const totalNetReturns = totalUserInvestment + estimatedSavingsDividend + stellarYieldBoost;
  const netProfit = estimatedSavingsDividend + stellarYieldBoost;
  const effectiveApy = ((netProfit / totalUserInvestment) * 100).toFixed(1);

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-extrabold text-ink-900">ROSCA Savings & Yield Calculator</h3>
            <p className="text-xs text-ink-500">Calculate bidding dividends and Stellar +4.8% APY vault returns.</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 rounded-2xl bg-ink-50/70 p-4 ring-1 ring-ink-150">
          <div>
            <div className="flex justify-between text-xs font-semibold text-ink-700 mb-1">
              <span>Monthly Contribution</span>
              <span className="font-bold text-brand-600">₹{monthlyContribution.toLocaleString()} INR</span>
            </div>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-ink-700 mb-1">
              <span>Group Size (Members)</span>
              <span className="font-bold text-sapphire-600">{memberCount} Members</span>
            </div>
            <input
              type="range"
              min={3}
              max={25}
              value={memberCount}
              onChange={(e) => setMemberCount(Number(e.target.value))}
              className="w-full accent-sapphire-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-ink-700 mb-1">
              <span>Est. Avg Auction Discount</span>
              <span className="font-bold text-amber-600">{bidDiscountPct}% Discount</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              value={bidDiscountPct}
              onChange={(e) => setBidDiscountPct(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Results Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-ink-900 to-slate-950 p-5 text-white shadow-lift border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
            <span className="text-slate-400">Total Capital Contributed</span>
            <span className="font-mono font-bold text-slate-200">₹{totalUserInvestment.toLocaleString()} INR</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Bidding Dividends</span>
              <span className="font-display text-lg font-extrabold text-white block mt-0.5">
                +₹{Math.round(estimatedSavingsDividend).toLocaleString()} INR
              </span>
            </div>

            <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Stellar Yield (+4.8%)</span>
              <span className="font-display text-lg font-extrabold text-white block mt-0.5">
                +₹{Math.round(stellarYieldBoost).toLocaleString()} INR
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Total Projected Return</span>
              <span className="font-display text-2xl font-black text-white">₹{Math.round(totalNetReturns).toLocaleString()} INR</span>
            </div>
            <div className="text-right">
              <span className="badge bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 text-xs font-bold">
                +{effectiveApy}% Effective APY
              </span>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="btn-primary w-full py-3 rounded-xl shadow-soft">
          Done & Close Calculator
        </button>
      </div>
    </Modal>
  );
}
