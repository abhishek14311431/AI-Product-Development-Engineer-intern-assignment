const steps = ['Research', 'Financials', 'News', 'Competition', 'Decision'];

export default function LoadingTimeline({ active = false }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Analysis timeline</h2>
        <span className="text-sm text-slate-400">{active ? 'Running' : 'Idle'}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`rounded-2xl border px-3 py-4 text-center text-sm transition ${
              active
                ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                : 'border-white/10 bg-slate-950/50 text-slate-400'
            }`}
          >
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500">
              Step {index + 1}
            </div>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
