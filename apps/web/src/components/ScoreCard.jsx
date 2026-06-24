export default function ScoreCard({ score, breakdown }) {
  const displayScore = Number.isFinite(score) ? score : 0;
  
  const scoreStyle = displayScore >= 70 
    ? 'bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
    : 'bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]';

  const categories = [
    { label: 'Growth Potential', val: breakdown?.growthPotential, max: 25 },
    { label: 'Financial Health', val: breakdown?.financialHealth, max: 25 },
    { label: 'Competitive Advantage', val: breakdown?.competitiveAdvantage, max: 20 },
    { label: 'Market Sentiment', val: breakdown?.marketSentiment, max: 15 },
    { label: 'Risk Assessment', val: breakdown?.riskAssessment, max: 15 },
  ];

  const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-glow transition-all duration-300 hover:border-cyan-500/20">
      <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
        <div className="min-w-[180px] text-center md:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Total Scorecard</p>
          <div className="mt-3 flex items-baseline justify-center md:justify-start gap-2">
            <span className={`text-6xl font-black tracking-tight ${scoreStyle}`}>{displayScore}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">/ 100</span>
          </div>
        </div>

        {hasBreakdown ? (
          <div className="flex-1 grid gap-x-8 gap-y-4 md:border-l md:border-slate-800/60 md:pl-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, idx) => {
              const scoreVal = Number.isFinite(cat.val) ? cat.val : 0;
              const pct = Math.round((scoreVal / cat.max) * 100);
              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] font-bold tracking-wide">
                    <span className="text-slate-400">{cat.label}</span>
                    <span className="text-slate-200">{scoreVal} <span className="opacity-40">/ {cat.max}</span></span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-950/60 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs leading-5 text-slate-400 flex-1 md:border-l md:border-slate-800/60 md:pl-8">
            Rubric scoring: Growth potential (25%), financials (25%), competition (20%), sentiment (15%), and risks (15%).
          </p>
        )}
      </div>
    </div>
  );
}
