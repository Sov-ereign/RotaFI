import { useEffect, useState } from 'react';

export function FpsCounter() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!import.meta.env.DEV) return null;

  const color =
    fps >= 50
      ? 'bg-emerald-600/90 text-white ring-emerald-400'
      : fps >= 30
      ? 'bg-amber-500/90 text-white ring-amber-400'
      : 'bg-red-600/90 text-white ring-red-400';

  return (
    <div className="fixed bottom-3 right-3 z-50 pointer-events-none select-none">
      <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold shadow-xl backdrop-blur-md ring-1 transition-colors ${color}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        <span>{fps} FPS</span>
        <span className="text-[9px] opacity-75 font-normal">DEV</span>
      </div>
    </div>
  );
}
