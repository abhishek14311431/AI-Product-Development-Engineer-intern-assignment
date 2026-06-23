function SectionBlock({ title, content }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-glow">
      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{content || 'No content yet.'}</p>
    </section>
  );
}

export default function ResearchSection({ research, financialAnalysis, newsAnalysis, competitionAnalysis }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionBlock title="Research summary" content={research} />
      <SectionBlock title="Financial analysis" content={financialAnalysis} />
      <SectionBlock title="News analysis" content={newsAnalysis} />
      <SectionBlock title="Competition analysis" content={competitionAnalysis} />
    </div>
  );
}
