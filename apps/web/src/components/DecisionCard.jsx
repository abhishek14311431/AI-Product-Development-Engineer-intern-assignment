function getReasonBullets(reasoningText) {
  if (!reasoningText) return [];
  
  // Split by newlines first
  const lines = reasoningText.split('\n').map(l => l.trim()).filter(Boolean);
  
  // If there are actual bullet points, extract them
  const bullets = lines.filter(l => l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l))
    .map(l => l.replace(/^[-*\d.]+\s*/, ''));
    
  if (bullets.length >= 3) {
    return bullets.slice(0, 4);
  }
  
  // Otherwise, split the original text by sentences
  const sentences = reasoningText
    .replace(/^[-\d.\s]+/g, '') // remove leading symbols
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5); // avoid tiny fragments
    
  if (sentences.length > 0) {
    // If the last sentence doesn't have a period, add one
    return sentences.map(s => s.endsWith('.') ? s : s + '.').slice(0, 4);
  }
  
  return [reasoningText];
}

export default function DecisionCard({ decision, score, reasoning }) {
  const isInvest = decision === 'INVEST';
  const isPass = decision === 'PASS';
  const isWarning = decision === 'INSUFFICIENT_DATA' || decision === 'INVALID_COMPANY';

  const displayScore = Number.isFinite(score) ? score : 0;

  // Decide colors based on decision
  const borderGlowClass = isInvest 
    ? 'border-emerald-500/30 bg-emerald-950/10 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
    : isPass 
      ? 'border-amber-500/30 bg-amber-950/10 shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
      : 'border-rose-500/30 bg-rose-950/10 shadow-[0_0_30px_rgba(239,68,68,0.1)]';

  const textGradientClass = isInvest 
    ? 'from-emerald-400 to-teal-400' 
    : isPass 
      ? 'from-amber-400 to-rose-400' 
      : 'from-rose-400 to-red-400';

  const scoreTextClass = isInvest ? 'text-emerald-400' : isPass ? 'text-amber-400' : 'text-rose-400';

  const reasons = getReasonBullets(reasoning);

  return (
    <div className={`glass-panel rounded-3xl p-6 sm:p-8 border transition-all duration-500 ${borderGlowClass}`}>
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-between">
        {/* Left Side: Score & Decision Gauge */}
        <div className="flex flex-col items-center text-center md:text-left md:items-start min-w-[220px]">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            Investment Recommendation
          </span>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-800 bg-slate-950/50 shadow-inner">
              <span className={`text-2xl font-black ${scoreTextClass}`}>
                {displayScore}%
              </span>
              {/* Outer glow accent */}
              <div className="absolute inset-[-4px] rounded-full border-4 border-transparent border-t-cyan-400/40 animate-pulse" />
            </div>
            <div>
              <div className={`text-3xl font-black uppercase tracking-tight bg-gradient-to-r ${textGradientClass} bg-clip-text text-transparent`}>
                {decision || 'PENDING'}
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Recommendation Score
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Key Reasons */}
        <div className="flex-1 w-full border-t md:border-t-0 md:border-l border-slate-800/80 pt-6 md:pt-0 md:pl-10">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300 mb-3.5">
            Key Decision Factors
          </h4>
          <ul className="space-y-3">
            {reasons.length > 0 ? (
              reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r ${textGradientClass}`} />
                  <span>{reason}</span>
                </li>
              ))
            ) : (
              <li className="text-xs italic text-slate-500 leading-relaxed">
                The consensus recommendations and key decision factors will render here once the pipeline finishes.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
