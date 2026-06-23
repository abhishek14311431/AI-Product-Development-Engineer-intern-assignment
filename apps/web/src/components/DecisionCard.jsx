export default function DecisionCard({ decision, reasoning }) {
  const isInvest = decision === 'INVEST';
  
  const glassStyle = isInvest 
    ? 'border-emerald-500/35 bg-emerald-950/20 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
    : decision 
      ? 'border-amber-500/35 bg-amber-950/20 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
      : 'text-slate-300';

  const badgeStyle = isInvest 
    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-black' 
    : decision 
      ? 'bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent font-black'
      : 'text-slate-400 font-bold';

  return (
    <div className={`glass-panel rounded-3xl p-6 shadow-glow transition-all duration-300 ${glassStyle}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-85">Orchestrator Decision</p>
      <div className={`mt-3 text-4xl tracking-tight ${badgeStyle}`}>
        {decision || 'Awaiting Data'}
      </div>
      <p className="mt-4 text-xs leading-6 text-white/80">
        {reasoning || 'The multi-agent consensus decision and synthesis notes will render here after the pipeline completes.'}
      </p>
    </div>
  );
}
