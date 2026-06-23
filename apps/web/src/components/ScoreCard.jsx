export default function ScoreCard({ score }) {
  const displayScore = Number.isFinite(score) ? score : 0;
  
  const scoreStyle = displayScore >= 70 
    ? 'bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
    : 'bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]';

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-glow transition-all duration-300 hover:border-cyan-500/20">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Investment Score</p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className={`text-6xl font-black tracking-tight ${scoreStyle}`}>{displayScore}</span>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">/ 100</span>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-400">
        Rubric scoring: Growth potential (25%), financials (25%), competition (20%), sentiment (15%), and risks (15%).
      </p>
    </div>
  );
}
