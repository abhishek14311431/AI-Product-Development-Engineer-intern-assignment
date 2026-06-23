export default function DecisionCard({ decision, reasoning }) {
  const isInvest = decision === 'INVEST';
  const tone = isInvest ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200';

  return (
    <div className={`rounded-3xl border p-5 shadow-glow backdrop-blur-xl ${tone}`}>
      <p className="text-sm font-medium uppercase tracking-[0.3em] opacity-80">Decision</p>
      <div className="mt-3 text-4xl font-black">{decision || 'Awaiting analysis'}</div>
      <p className="mt-4 text-sm leading-6 text-white/80">{reasoning || 'The decision rationale will appear after analysis completes.'}</p>
    </div>
  );
}
