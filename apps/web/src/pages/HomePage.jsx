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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(180deg,_#0b1020_0%,_#060913_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-cyan-300">Investment Research Agent</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
            Research a company and get an investment recommendation.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Enter a company name, run the analysis workflow, and review the research, financials, news,
            competition, score, and decision in one place.
          </p>
        </header>

        <SearchBox
          value={company}
          loading={loading}
          onChange={(event) => setCompany(event.target.value)}
          onSubmit={handleSubmit}
        />

        {error ? (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200 shadow-glow">
            {error}
          </div>
        ) : null}

        <LoadingTimeline active={loading} />

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300 shadow-glow backdrop-blur-xl">
            Running backend analysis. This usually takes a few moments.
          </div>
        ) : null}

        {data ? (
          <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-4">
              <ResearchSection
                research={data.research}
                financialAnalysis={data.financialAnalysis}
                newsAnalysis={data.newsAnalysis}
                competitionAnalysis={data.competitionAnalysis}
              />
            </div>
            <div className="grid gap-4 self-start lg:sticky lg:top-6">
              <ScoreCard score={data.score} />
              <DecisionCard decision={data.decision} reasoning={data.reasoning} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
