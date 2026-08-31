import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

interface MetricItem {
  targetValue: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

function AnimatedNumber({ targetValue, decimals = 0, prefix = '', suffix = '' }: MetricItem) {
  const { theme } = useApp();
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(targetValue);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          observer.unobserve(element);

          const duration = 1800; // 1.8 seconds animation
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            // Ease-out cubic curve: 1 - (1 - t)^3
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = easeOutProgress * targetValue;

            setDisplayValue(currentValue);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(targetValue);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [targetValue]);

  const formattedNumber = displayValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      ref={elementRef}
      data-target-value={targetValue}
      data-decimals={decimals}
      data-prefix={prefix}
      data-suffix={suffix}
      className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${
        theme === 'dark' ? 'font-mono text-white' : 'font-display text-slate-900'
      }`}
    >
      {prefix}{formattedNumber}{suffix}
    </span>
  );
}

export function StatsBar() {
  const { theme } = useApp();
  const stats: MetricItem[] = [
    { targetValue: 125000, decimals: 0, prefix: '₹', suffix: '', label: 'Total ROSCA TVL' },
    { targetValue: 50, decimals: 0, prefix: '', suffix: '+', label: 'Active Member Circles' },
    { targetValue: 99.8, decimals: 1, prefix: '', suffix: '%', label: 'On-Time Rotation Rate' },
    { targetValue: 4.8, decimals: 1, prefix: '', suffix: 's', label: 'Avg Stellar Finality' },
  ];

  return (
    <section className={`w-full border-y py-8 sm:py-10 transition-colors duration-300 ${
      theme === 'dark'
        ? 'border-white/10 bg-slate-950/80 backdrop-blur-xl text-white'
        : 'border-slate-200 bg-white/90 backdrop-blur-xl text-slate-900'
    }`}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x ${
          theme === 'dark' ? 'md:divide-white/10' : 'md:divide-slate-200'
        }`}>
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center text-center px-4 py-2"
            >
              <AnimatedNumber {...stat} />
              <span className={`mt-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
