import React from 'react';

function parseInline(text) {
  const parts = text.split(/\*\*([^*]+)\*\//g);
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
        <h4 key={idx} className="mt-3 mb-1.5 text-xs font-bold text-slate-100 tracking-wide font-display uppercase">
          {trimmed.substring(4)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={idx} className="mt-4 mb-2 text-xs font-bold text-slate-100 tracking-wide font-display">
          {trimmed.substring(3)}
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2 key={idx} className="mt-5 mb-2.5 text-sm font-bold text-slate-100 tracking-wide font-display">
          {trimmed.substring(2)}
        </h2>
      );
    }
    
    // List item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      return (
        <li key={idx} className="ml-4 list-disc pl-1 mb-1 text-xs leading-5 text-slate-300">
          {parseInline(content)}
        </li>
      );
    }
    
    // Paragraph empty lines
    if (trimmed === '') {
      return <div key={idx} className="h-1.5" />;
    }
    
    // Default paragraph
    return (
      <p key={idx} className="mb-1.5 text-xs leading-5 text-slate-300">
        {parseInline(line)}
      </p>
    );
  });
}

function extractSection(text, title) {
  if (!text) return '';
  const regex = new RegExp(`(?:^|\\n)(?:#+|\\-\\s*|\\*\\s*)(${title})\\b([\\s\\S]*?)(?=\\n(?:#+|\\-\\s*|\\*\\s*)(?:Company Overview|Business Model|Revenue Drivers|Industry Position|Key Strengths|Key Weaknesses|Positive Signals|Negative Signals|Overall Market Sentiment|Recent developments|Positive news|Negative news|Legal issues|Risks)|$)`, 'i');
  const match = text.match(regex);
  return match ? match[2].trim() : '';
}

function removeSections(text, titles) {
  if (!text) return '';
  let cleaned = text;
  for (const title of titles) {
    const regex = new RegExp(`(?:^|\\n)(?:#+|\\-\\s*|\\*\\s*)(${title})\\b([\\s\\S]*?)(?=\\n(?:#+|\\-\\s*|\\*\\s*)(?:Company Overview|Business Model|Revenue Drivers|Industry Position|Key Strengths|Key Weaknesses|Positive Signals|Negative Signals|Overall Market Sentiment|Recent developments|Positive news|Negative news|Legal issues|Risks)|$)`, 'i');
    cleaned = cleaned.replace(regex, '');
  }
  return cleaned.trim();
}

function getDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
  } catch (e) {
    return '';
  }
}

function SectionBlock({ title, content, footer }) {
  return (
    <section className="glass-panel glass-card-hover rounded-3xl p-6 shadow-glow transition-all duration-300 flex flex-col h-full min-h-[19.5rem]">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-gradient-cyan border-b border-slate-800/60 pb-3 mb-3.5">
        {title}
      </h3>
      <div className="relative flex-1 max-h-[11rem] overflow-hidden pr-1 select-text mb-2">
        <div className="text-xs leading-5 text-slate-300">
          {parseMarkdown(content)}
        </div>
        {/* Soft dark-gradient fade overlay to cap exactly 7-9 lines */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#04060f] to-transparent pointer-events-none" />
      </div>
      {footer}
    </section>
  );
}

export default function ResearchSection({ research, financialAnalysis, newsAnalysis, competitionAnalysis, newsSources }) {
  // Extract Strengths and Weaknesses/Risks from research
  const keyStrengths = extractSection(research, 'Key Strengths') || extractSection(research, 'Growth Opportunities');
  const keyWeaknesses = extractSection(research, 'Key Weaknesses') || extractSection(research, 'Risks');

  // Clean research summary to avoid duplication
  const cleanedResearch = removeSections(research, [
    'Key Strengths',
    'Key Weaknesses',
    'Growth Opportunities',
    'Risks'
  ]);

  // Extract news website domains for News card highlight footer
  const newsSourcesTags = newsSources && newsSources.length > 0 ? (
    <div className="mt-auto pt-2.5 border-t border-slate-800/40 flex flex-wrap items-center gap-1.5 pointer-events-auto">
      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mr-1">Sources:</span>
      {Array.from(new Set(newsSources.map(s => getDomain(s.url)).filter(Boolean))).slice(0, 3).map((domain, idx) => (
        <span key={idx} className="inline-flex items-center gap-1 rounded bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 text-[9px] font-semibold text-cyan-400">
          <span className="h-1 w-1 rounded-full bg-cyan-400"></span>
          {domain}
        </span>
      ))}
    </div>
  ) : null;

  return (
    <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <SectionBlock title="Research Summary" content={cleanedResearch} />
      <SectionBlock title="Financial Analysis" content={financialAnalysis} />
      <SectionBlock title="News Intelligence" content={newsAnalysis} footer={newsSourcesTags} />
      <SectionBlock title="Competitive Position" content={competitionAnalysis} />
      <SectionBlock title="Key Strengths" content={keyStrengths || 'Analyzing company advantages...'} />
      <SectionBlock title="Key Risks & Weaknesses" content={keyWeaknesses || 'Analyzing company challenges...'} />
    </div>
  );
}
