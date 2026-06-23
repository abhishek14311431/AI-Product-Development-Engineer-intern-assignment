import { useState, useEffect } from 'react';

const steps = ['Research Agent', 'Financial Agent', 'News Agent', 'Competition Agent', 'Decision Engine'];

export default function LoadingTimeline({ active = false }) {
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    if (!active) {
      setCurrentStep(-1);
      return;
    }

    setCurrentStep(0);
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 4 ? prev + 1 : 4));
    }, 1800);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-glow transition-all duration-300">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-white">Multi-Agent Pipeline</h2>
        <span className="flex items-center gap-2 text-xs font-semibold">
          {active ? (
            <>
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="text-cyan-300 uppercase tracking-widest">Orchestrating...</span>
            </>
          ) : (
            <span className="text-slate-500 uppercase tracking-widest">Idle / Ready</span>
          )}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isActive = currentStep === index;
          
          let cardStyle = 'border-white/5 bg-slate-950/20 text-slate-500';
          let labelStyle = 'text-slate-600';
          
          if (isActive) {
            cardStyle = 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse';
            labelStyle = 'text-cyan-400 font-bold';
          } else if (isCompleted) {
            cardStyle = 'border-purple-500/30 bg-purple-950/15 text-purple-200';
            labelStyle = 'text-purple-400 font-semibold';
          }

          return (
            <div
              key={step}
              className={`rounded-2xl border px-3 py-4 text-center text-xs transition-all duration-500 ${cardStyle}`}
            >
              <div className={`mb-2 text-[9px] uppercase tracking-[0.2em] ${labelStyle}`}>
                {isCompleted ? '✓ Done' : isActive ? '● Active' : `Stage ${index + 1}`}
              </div>
              <div className="font-semibold text-white/95">{step}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
