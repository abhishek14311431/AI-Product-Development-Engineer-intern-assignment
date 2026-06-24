import { useState } from 'react';
import SearchBox from '../components/SearchBox.jsx';
import LoadingTimeline from '../components/LoadingTimeline.jsx';
import ScoreCard from '../components/ScoreCard.jsx';
import DecisionCard from '../components/DecisionCard.jsx';
import ResearchSection from '../components/ResearchSection.jsx';
import { useCompanyAnalysis } from '../hooks/useCompanyAnalysis.js';

export default function HomePage() {
  const [company, setCompany] = useState('Tesla');
  const { data, loading, error, submit } = useCompanyAnalysis();

  async function handleSubmit(event) {
    event.preventDefault();
    await submit(company);
  }

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-10 backdrop-blur-[1px]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="glass-panel glass-panel-glow rounded-[2rem] p-8 sm:p-10 transition-all duration-500">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-gradient-cyan">Investment Research Agent</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl leading-[1.1]">
            Research any company. <br />Get an <span className="text-gradient-cyan">Investment Decision</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Enter a company name to run the multi-agent workflow. The orchestration engine gathers and synthesizes market overview, financial strength, recent news, and competitive positioning.
          </p>
        </header>

        <SearchBox
          value={company}
          loading={loading}
          onChange={(event) => setCompany(event.target.value)}
          onSubmit={handleSubmit}
        />

        {error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-950/40 p-5 text-rose-200 shadow-glow backdrop-blur-xl">
            <span className="font-bold text-rose-400">Error:</span> {error}
          </div>
        ) : null}

        <LoadingTimeline active={loading} />

        {loading ? (
          <div className="glass-panel rounded-3xl p-6 text-sm text-slate-300 animate-pulse text-center">
            Running multi-agent analysis workflow. Synthesizing research, news, and financials...
          </div>
        ) : null}

        {data ? (
          <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="grid gap-4">
              <ResearchSection
                research={data.research}
                financialAnalysis={data.financialAnalysis}
                newsAnalysis={data.newsAnalysis}
                competitionAnalysis={data.competitionAnalysis}
              />
            </div>
            <div className="grid gap-4 self-start lg:sticky lg:top-6">
              <ScoreCard score={data.score} breakdown={data.scoreBreakdown} />
              <DecisionCard decision={data.decision} reasoning={data.reasoning} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
