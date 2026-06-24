function SectionBlock({ title, content }) {
  return (
    <section className="glass-panel glass-card-hover rounded-3xl p-6 shadow-glow transition-all duration-300">
      <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-gradient-cyan">{title}</h3>
      <div className="mt-4 whitespace-pre-wrap text-xs leading-6 text-slate-200/90">{content || 'No content yet.'}</div>
    </section>
  );
}

export default function ResearchSection({ research, financialAnalysis, newsAnalysis, competitionAnalysis }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionBlock title="Research Summary" content={research} />
      <SectionBlock title="Financial Analysis" content={financialAnalysis} />
      <SectionBlock title="News intelligence" content={newsAnalysis} />
      <SectionBlock title="Competitive Position" content={competitionAnalysis} />
    </div>
  );
}
