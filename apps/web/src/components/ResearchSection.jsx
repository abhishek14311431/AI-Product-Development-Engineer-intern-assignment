import React from 'react';

function parseInline(text) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length === 1) return text;
  
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-semibold text-white">{part}</strong>;
    }
    return part;
  });
}

function parseMarkdown(text) {
  if (!text) return <p className="text-xs text-slate-500 italic">No content yet.</p>;
  
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    
    // Headers
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={idx} className="mt-4 mb-2 text-xs font-bold text-slate-100 tracking-wide font-display uppercase">
          {trimmed.substring(4)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={idx} className="mt-5 mb-2.5 text-sm font-bold text-slate-100 tracking-wide font-display">
          {trimmed.substring(3)}
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2 key={idx} className="mt-6 mb-3 text-base font-bold text-slate-100 tracking-wide font-display">
          {trimmed.substring(2)}
        </h2>
      );
    }
    
    // List item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      return (
        <li key={idx} className="ml-4 list-disc pl-1 mb-1.5 text-xs leading-6 text-slate-300">
          {parseInline(content)}
        </li>
      );
    }
    
    // Paragraph empty lines
    if (trimmed === '') {
      return <div key={idx} className="h-2" />;
    }
    
    // Default paragraph
    return (
      <p key={idx} className="mb-2 text-xs leading-6 text-slate-300">
        {parseInline(line)}
      </p>
    );
  });
}

function SectionBlock({ title, content }) {
  return (
    <section className="glass-panel glass-card-hover rounded-3xl p-6 shadow-glow transition-all duration-300 flex flex-col">
      <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-gradient-cyan border-b border-slate-800/60 pb-3 mb-4">
        {title}
      </h3>
      <div className="flex-1 text-xs leading-6 text-slate-300">
        {parseMarkdown(content)}
      </div>
    </section>
  );
}

export default function ResearchSection({ research, financialAnalysis, newsAnalysis, competitionAnalysis }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <SectionBlock title="Research Summary" content={research} />
      <SectionBlock title="Financial Analysis" content={financialAnalysis} />
      <SectionBlock title="News Intelligence" content={newsAnalysis} />
      <SectionBlock title="Competitive Position" content={competitionAnalysis} />
    </div>
  );
}
