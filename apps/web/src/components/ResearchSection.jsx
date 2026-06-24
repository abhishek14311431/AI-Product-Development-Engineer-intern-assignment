import React from 'react';

// ── Inline text formatter ────────────────────────────────────────────────────
function parseInline(text) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-white">{part}</strong>
      : part
  );
}

// ── Full markdown parser (no height limit) ───────────────────────────────────
function parseMarkdown(text) {
  if (!text) return <p className="text-xs text-slate-500 italic">No data available.</p>;

  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={idx} className="h-2" />);
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="mt-3 mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
          {trimmed.slice(4)}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={idx} className="mt-4 mb-1.5 text-xs font-bold text-slate-100 tracking-wide font-display">
          {trimmed.slice(3)}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={idx} className="mt-5 mb-2 text-sm font-bold text-white tracking-wide font-display">
          {trimmed.slice(2)}
        </h2>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 mb-1.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/60" />
          <span className="text-xs leading-5 text-slate-300">{parseInline(trimmed.slice(2))}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={idx} className="mb-1.5 text-xs leading-5 text-slate-300">
          {parseInline(line)}
        </p>
      );
    }
  });

  return elements;
}

// ── Extract a named section from markdown text ───────────────────────────────
function extractSection(text, ...titles) {
  if (!text) return '';

  const sectionHeaders = [
    'Company Overview', 'Business Model', 'Revenue Drivers', 'Industry Position',
    'Key Strengths', 'Key Weaknesses', 'Growth Opportunities', 'Risks',
    'Positive Signals', 'Negative Signals', 'Overall Market Sentiment',
    'Strengths', 'Weaknesses', 'Competitive Position',
  ];

  for (const title of titles) {
    const lines = text.split('\n');
    let found = false;
    let sectionLines = [];

    for (let i = 0; i < lines.length; i++) {
      const clean = lines[i].replace(/^[#\-\*\s]+/, '').trim().toLowerCase();
      if (!found && clean === title.toLowerCase()) {
        found = true;
        continue;
      }
      if (found) {
        const isNewSection = sectionHeaders.some(h =>
          lines[i].replace(/^[#\-\*\s]+/, '').trim().toLowerCase() === h.toLowerCase()
        );
        if (isNewSection) break;
        sectionLines.push(lines[i]);
      }
    }

    const result = sectionLines.join('\n').trim();
    if (result) return result;
  }

  return '';
}

// ── Domain extractor for source badges ──────────────────────────────────────
function getDomain(url) {
  try {
    const h = new URL(url).hostname;
    return h.startsWith('www.') ? h.slice(4) : h;
  } catch {
    return '';
  }
}

// ── Card icons ───────────────────────────────────────────────────────────────
const ICONS = {
  research: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  financial: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  news: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  competition: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  strengths: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  risks: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

// ── Individual card component ────────────────────────────────────────────────
function ResearchCard({ title, icon, accent = 'cyan', content, footer }) {
  const accentMap = {
    cyan: {
      icon: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/20',
      title: 'text-cyan-300',
      border: 'border-cyan-500/10 hover:border-cyan-500/25',
    },
    emerald: {
      icon: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20',
      title: 'text-emerald-300',
      border: 'border-emerald-500/10 hover:border-emerald-500/25',
    },
    purple: {
      icon: 'text-purple-400 bg-purple-950/40 border-purple-500/20',
      title: 'text-purple-300',
      border: 'border-purple-500/10 hover:border-purple-500/25',
    },
    amber: {
      icon: 'text-amber-400 bg-amber-950/40 border-amber-500/20',
      title: 'text-amber-300',
      border: 'border-amber-500/10 hover:border-amber-500/25',
    },
    rose: {
      icon: 'text-rose-400 bg-rose-950/40 border-rose-500/20',
      title: 'text-rose-300',
      border: 'border-rose-500/10 hover:border-rose-500/25',
    },
    indigo: {
      icon: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20',
      title: 'text-indigo-300',
      border: 'border-indigo-500/10 hover:border-indigo-500/25',
    },
  };
  const a = accentMap[accent] || accentMap.cyan;

  return (
    <div className={`glass-panel rounded-3xl p-5 shadow-glow transition-all duration-300 flex flex-col gap-4 ${a.border}`}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/50 pb-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${a.icon}`}>
          {icon}
        </div>
        <h3 className={`text-[11px] font-black uppercase tracking-[0.22em] ${a.title}`}>
          {title}
        </h3>
      </div>

      {/* Content — no height cap, everything visible */}
      <div className="text-xs leading-5 text-slate-300 flex-1">
        {parseMarkdown(content)}
      </div>

      {/* Optional footer (e.g. news source badges) */}
      {footer}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function ResearchSection({ research, financialAnalysis, newsAnalysis, competitionAnalysis, newsSources }) {
  // Extract Strengths and Weaknesses from the research text
  const keyStrengths = extractSection(research, 'Key Strengths', 'Strengths', 'Growth Opportunities');
  const keyWeaknesses = extractSection(research, 'Key Weaknesses', 'Weaknesses', 'Risks');

  // Build news source domain badges
  const newsFooter = newsSources && newsSources.length > 0 ? (
    <div className="mt-1 pt-3 border-t border-slate-800/50 flex flex-wrap items-center gap-1.5">
      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mr-1">Sources:</span>
      {Array.from(new Set(
        newsSources.map(s => getDomain(s.url)).filter(Boolean)
      )).slice(0, 4).map((domain, idx) => (
        <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 text-[9px] font-semibold text-cyan-400">
          <span className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
          {domain}
        </span>
      ))}
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: Research Summary + Financial Analysis (side-by-side on large screens) */}
      <div className="grid gap-5 md:grid-cols-2">
        <ResearchCard
          title="Research Summary"
          icon={ICONS.research}
          accent="cyan"
          content={research}
        />
        <ResearchCard
          title="Financial Analysis"
          icon={ICONS.financial}
          accent="emerald"
          content={financialAnalysis}
        />
      </div>

      {/* Row 2: News Intelligence (full width) */}
      <ResearchCard
        title="News Intelligence"
        icon={ICONS.news}
        accent="indigo"
        content={newsAnalysis}
        footer={newsFooter}
      />

      {/* Row 3: Competitive Position (full width) */}
      <ResearchCard
        title="Competitive Position"
        icon={ICONS.competition}
        accent="purple"
        content={competitionAnalysis}
      />

      {/* Row 4: Strengths + Weaknesses (side-by-side) */}
      <div className="grid gap-5 md:grid-cols-2">
        <ResearchCard
          title="Key Strengths"
          icon={ICONS.strengths}
          accent="emerald"
          content={keyStrengths || undefined}
        />
        <ResearchCard
          title="Key Risks & Weaknesses"
          icon={ICONS.risks}
          accent="rose"
          content={keyWeaknesses || undefined}
        />
      </div>
    </div>
  );
}
