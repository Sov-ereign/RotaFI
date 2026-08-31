import { useState } from 'react';
import { Download, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';

type RangeOption = '24h' | '7d' | '30d' | '90d';

interface RangeData {
  rangeName: string;
  comparedPeriod: string;
  metrics: {
    label: string;
    value: string;
    change: string;
    isPositive: boolean;
    bars: number[]; // 12 values from 10 to 100
  }[];
  chartPolyline1: string; // SVG points for TVL Escrow
  chartArea1: string;     // SVG polygon for fill
  chartPolyline2: string; // SVG points for Yield
  chartArea2: string;
}

const RANGE_DATASETS: Record<RangeOption, RangeData> = {
  '24h': {
    rangeName: '24h',
    comparedPeriod: 'Compared to previous 24 hours',
    metrics: [
      { label: 'Testnet TVL Escrow', value: '₹1,25,000', change: '+4.2%', isPositive: true, bars: [20, 35, 40, 30, 55, 60, 50, 75, 80, 70, 90, 100] },
      { label: 'Active Rotations', value: '18 Circles', change: '+2', isPositive: true, bars: [40, 40, 50, 60, 60, 70, 70, 80, 80, 90, 90, 100] },
      { label: 'Volume Settled', value: '₹45,200', change: '+12.8%', isPositive: true, bars: [15, 25, 30, 45, 40, 65, 70, 60, 85, 80, 95, 100] },
      { label: 'Avg Finality Speed', value: '4.8s', change: '-0.4s', isPositive: true, bars: [90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35] },
    ],
    chartPolyline1: '0,140 40,130 80,110 120,120 160,90 200,95 240,70 280,75 320,50 360,40 400,30 440,20',
    chartArea1: '0,160 0,140 40,130 80,110 120,120 160,90 200,95 240,70 280,75 320,50 360,40 400,30 440,20 440,160',
    chartPolyline2: '0,150 40,145 80,135 120,130 160,115 200,120 240,105 280,95 320,80 360,75 400,60 440,50',
    chartArea2: '0,160 0,150 40,145 80,135 120,130 160,115 200,120 240,105 280,95 320,80 360,75 400,60 440,50 440,160',
  },
  '7d': {
    rangeName: '7d',
    comparedPeriod: 'Compared to previous 7 days',
    metrics: [
      { label: 'Testnet TVL Escrow', value: '₹5,40,000', change: '+18.5%', isPositive: true, bars: [30, 25, 45, 50, 40, 60, 70, 65, 85, 80, 95, 100] },
      { label: 'Active Rotations', value: '52 Circles', change: '+8', isPositive: true, bars: [30, 35, 45, 50, 55, 65, 70, 75, 85, 90, 95, 100] },
      { label: 'Volume Settled', value: '₹2,10,000', change: '+24.1%', isPositive: true, bars: [20, 30, 40, 35, 55, 60, 75, 70, 85, 90, 95, 100] },
      { label: 'Avg Finality Speed', value: '4.6s', change: '-0.6s', isPositive: true, bars: [85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30] },
    ],
    chartPolyline1: '0,150 40,120 80,130 120,100 160,85 200,70 240,75 280,50 320,45 360,30 400,25 440,15',
    chartArea1: '0,160 0,150 40,120 80,130 120,100 160,85 200,70 240,75 280,50 320,45 360,30 400,25 440,15 440,160',
    chartPolyline2: '0,155 40,140 80,145 120,125 160,110 200,95 240,90 280,75 320,65 360,55 400,45 440,35',
    chartArea2: '0,160 0,155 40,140 80,145 120,125 160,110 200,95 240,90 280,75 320,65 360,55 400,45 440,35 440,160',
  },
  '30d': {
    rangeName: '30d',
    comparedPeriod: 'Compared to previous 30 days',
    metrics: [
      { label: 'Testnet TVL Escrow', value: '₹18,20,000', change: '+32.4%', isPositive: true, bars: [15, 30, 25, 45, 55, 50, 70, 75, 80, 90, 85, 100] },
      { label: 'Active Rotations', value: '140 Circles', change: '+28', isPositive: true, bars: [20, 30, 40, 45, 55, 60, 70, 75, 80, 85, 90, 100] },
      { label: 'Volume Settled', value: '₹8,50,000', change: '+41.0%', isPositive: true, bars: [10, 25, 35, 45, 50, 65, 70, 80, 85, 90, 95, 100] },
      { label: 'Avg Finality Speed', value: '4.5s', change: '-0.8s', isPositive: true, bars: [95, 90, 85, 75, 70, 60, 55, 45, 40, 35, 30, 25] },
    ],
    chartPolyline1: '0,140 40,135 80,115 120,95 160,105 200,80 240,60 280,65 320,40 360,35 400,20 440,10',
    chartArea1: '0,160 0,140 40,135 80,115 120,95 160,105 200,80 240,60 280,65 320,40 360,35 400,20 440,10 440,160',
    chartPolyline2: '0,150 40,145 80,130 120,115 160,120 200,95 240,80 280,85 320,60 360,50 400,35 440,25',
    chartArea2: '0,160 0,150 40,145 80,130 120,115 160,120 200,95 240,80 280,85 320,60 360,50 400,35 440,25 440,160',
  },
  '90d': {
    rangeName: '90d',
    comparedPeriod: 'Compared to previous 90 days',
    metrics: [
      { label: 'Testnet TVL Escrow', value: '₹45,000,00', change: '+68.2%', isPositive: true, bars: [10, 20, 30, 40, 50, 60, 65, 75, 80, 85, 90, 100] },
      { label: 'Active Rotations', value: '380 Circles', change: '+110', isPositive: true, bars: [15, 25, 35, 45, 55, 65, 70, 80, 85, 90, 95, 100] },
      { label: 'Volume Settled', value: '₹22,40,000', change: '+85.6%', isPositive: true, bars: [10, 20, 30, 40, 50, 60, 70, 75, 85, 90, 95, 100] },
      { label: 'Avg Finality Speed', value: '4.4s', change: '-1.2s', isPositive: true, bars: [100, 90, 80, 70, 60, 50, 45, 35, 30, 25, 20, 15] },
    ],
    chartPolyline1: '0,155 40,140 80,125 120,110 160,85 200,75 240,55 280,45 320,30 360,25 400,15 440,5',
    chartArea1: '0,160 0,155 40,140 80,125 120,110 160,85 200,75 240,55 280,45 320,30 360,25 400,15 440,5 440,160',
    chartPolyline2: '0,158 40,148 80,135 120,125 160,105 200,95 240,75 280,65 320,50 360,40 400,30 440,18',
    chartArea2: '0,160 0,158 40,148 80,135 120,125 160,105 200,95 240,75 280,65 320,50 360,40 400,30 440,18 440,160',
  },
};

export function AnalyticsPanel() {
  const { theme } = useApp();
  const [activeRange, setActiveRange] = useState<RangeOption>('7d');
  const currentData = RANGE_DATASETS[activeRange];

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value,Change\n"
      + currentData.metrics.map(m => `"${m.label}","${m.value}","${m.change}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rotafi_analytics_${activeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-6 rounded-2xl p-6 shadow-sm border transition-all duration-300 ${
      theme === 'dark'
        ? 'liquid-glass bg-slate-900/80 border-white/10 text-white shadow-2xl backdrop-blur-2xl'
        : 'card bg-white border-slate-200/90 text-slate-900'
    }`}>
      {/* Header Row: Title, Subline, Range Chip Group, Export Button */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${
        theme === 'dark' ? 'border-white/10' : 'border-slate-100'
      }`}>
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            theme === 'dark'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
          }`}>
            <Activity className="h-3.5 w-3.5" /> Analytics Overview
          </span>
          <h2 className={`font-display text-2xl font-black tracking-tight mt-1.5 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            ROSCA Volume & Yield Trajectory
          </h2>
          <p className={`text-xs font-medium transition-all duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {currentData.comparedPeriod}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Chip Group: 24h, 7d, 30d, 90d */}
          <div className={`inline-flex items-center rounded-full p-1 text-xs font-bold border ${
            theme === 'dark' ? 'bg-slate-950/80 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['24h', '7d', '30d', '90d'] as RangeOption[]).map((r) => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className={`rounded-full px-3.5 py-1 transition-all duration-200 ${
                  activeRange === r
                    ? theme === 'dark' ? 'bg-white text-black font-black shadow-md' : 'bg-slate-900 text-white shadow-sm font-black'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Bordered Export Button */}
          <button
            onClick={handleExport}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm transition ${
              theme === 'dark'
                ? 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Download className={`h-3.5 w-3.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`} /> Export
          </button>
        </div>
      </div>

      {/* Four-Card Metric Row */}
      <div key={activeRange} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in">
        {currentData.metrics.map((m) => (
          <div key={m.label} className={`rounded-2xl border p-5 shadow-sm space-y-3 relative overflow-hidden group transition duration-300 ${
            theme === 'dark'
              ? 'bg-slate-950/80 border-white/10 text-white hover:border-emerald-500/30'
              : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>{m.label}</span>
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold border transition-all duration-300 ${
                  m.isPositive
                    ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {m.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.change}
              </span>
            </div>

            <div className={`font-display text-2xl font-black tracking-tight transition-all duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {m.value}
            </div>

            {/* Twelve-Bar Mini Chart with height transitions */}
            <div className="flex items-end gap-1 h-9 pt-2">
              {m.bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500 to-sky-400 opacity-75 group-hover:opacity-100 transition-all duration-500 ease-out"
                  style={{ height: `${h}%`, transitionDelay: `${i * 20}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Wider Chart Card */}
      <div className={`rounded-2xl border p-6 shadow-sm space-y-4 ${
        theme === 'dark' ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}>
          <div>
            <h3 className={`font-display text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Total Value Locked & Rotation Yield Trajectory
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Soroban contract escrow deposits vs compound yield returns</p>
          </div>

          {/* Dotted Series Legend */}
          <div className={`flex items-center gap-5 text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
              Stellar TVL Escrow
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-sm" />
              Compound Yield Returns
            </span>
          </div>
        </div>

        {/* SVG Area Chart over Faint Grid */}
        <div className="relative h-44 w-full pt-2">
          <svg className="h-full w-full overflow-visible" viewBox="0 0 440 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Faint Grid Lines */}
            <line x1="0" y1="40" x2="440" y2="40" stroke={theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="80" x2="440" y2="80" stroke={theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="120" x2="440" y2="120" stroke={theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} strokeWidth="1" strokeDasharray="4 4" />

            {/* Series 2 Fill & Line */}
            <polygon points={currentData.chartArea2} fill="url(#areaGrad2)" className="transition-all duration-700 ease-out" />
            <polyline points={currentData.chartPolyline2} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 ease-out" />

            {/* Series 1 Fill & Line */}
            <polygon points={currentData.chartArea1} fill="url(#areaGrad1)" className="transition-all duration-700 ease-out" />
            <polyline points={currentData.chartPolyline1} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 ease-out" />
          </svg>
        </div>
      </div>
    </div>
  );
}
