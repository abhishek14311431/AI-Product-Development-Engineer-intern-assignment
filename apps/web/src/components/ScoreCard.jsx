export default function ScoreCard({ score }) {
  const displayScore = Number.isFinite(score) ? score : 0;
  const tone = displayScore >= 70 ? 'text-emerald-300' : 'text-amber-300';

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Investment score</p>
      <div className={`mt-3 text-5xl font-black ${tone}`}>{displayScore}</div>
      <p className="mt-2 text-sm text-slate-300">Out of 100</p>
    </div>
  );
}
