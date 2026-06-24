import { useState } from 'react';
import SearchBox from '../components/SearchBox.jsx';
import LoadingTimeline from '../components/LoadingTimeline.jsx';
import ScoreCard from '../components/ScoreCard.jsx';
import DecisionCard from '../components/DecisionCard.jsx';
import ResearchSection from '../components/ResearchSection.jsx';
import { useCompanyAnalysis } from '../hooks/useCompanyAnalysis.js';

export default function HomePage() {
  const [company, setCompany] = useState('');
  const { data, loading, error, submit } = useCompanyAnalysis();
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!company.trim()) return;
    setHasSearched(true);
    await submit(company);
  }

  const showDashboard = hasSearched || loading || data;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-16">
      {/* Dynamic Ambient Glow Background Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-purple-600/10 blur-[130px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-cyan-600/10 blur-[130px] animate-pulse-slow-delay"></div>
        <div className="absolute top-[35%] left-[50%] w-[45%] h-[45%] rounded-full bg-indigo-600/5 blur-[110px] animate-pulse-medium"></div>
      </div>

      <main className="px-4 text-slate-100 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          {!showDashboard ? (
            /* Hero Centered State */
            <div className="flex min-h-[85vh] flex-col justify-center py-12">
              <div className="mx-auto w-full max-w-3xl text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  AI Multi-Agent Orchestrator
                </span>
                <h1 className="mt-6 text-5xl font-black tracking-tight text-white sm:text-7xl leading-[1.05] font-display">
                  Research Companies <br />
                  <span className="text-gradient-cyan">Intelligently.</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-400">
                  Enter any company name. Our multi-agent collective will scan the web, audit financials, evaluate sentiment, map competitors, and compute a weighted decision score.
                </p>
                
                <div className="mt-10">
                  <SearchBox
                    value={company}
                    loading={loading}
                    onChange={(event) => setCompany(event.target.value)}
                    onSubmit={handleSubmit}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Dashboard Active State */
            <div className="flex flex-col gap-6 pt-8">
              {/* Top Navbar Row */}
              <header className="glass-panel rounded-3xl p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-glow transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-[0_4px_12px_rgba(6,182,212,0.3)]">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h1 className="text-lg font-bold text-white tracking-tight leading-none font-display">Invesfy AI</h1>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">Multi-Agent Intelligence</p>
                  </div>
                </div>

                <div className="flex-1 sm:max-w-md">
                  <SearchBox
                    value={company}
                    loading={loading}
                    onChange={(event) => setCompany(event.target.value)}
                    onSubmit={handleSubmit}
                    compact={true}
                  />
                </div>
              </header>

              {error ? (
                <div className="rounded-3xl border border-rose-500/30 bg-rose-950/30 p-5 text-rose-200 shadow-glow backdrop-blur-xl">
                  <span className="font-bold text-rose-400">Analysis Error:</span> {error}
                </div>
              ) : null}

              <LoadingTimeline active={loading} />

              {loading ? (
                <div className="glass-panel rounded-3xl p-12 text-center shadow-glow">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
                  <p className="mt-5 text-xs text-slate-400 font-medium">
                    Orchestrating agents to research <strong className="text-cyan-400">{company}</strong>. Scanning web content, compiling financials, and analyzing competitor metrics...
                  </p>
                </div>
              ) : null}

              {data && !loading ? (
                <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
                  <div className="grid gap-5">
                    <ResearchSection
                      research={data.research}
                      financialAnalysis={data.financialAnalysis}
                      newsAnalysis={data.newsAnalysis}
                      competitionAnalysis={data.competitionAnalysis}
                    />
                  </div>
                  <div className="grid gap-5 self-start lg:sticky lg:top-6">
                    <ScoreCard score={data.score} breakdown={data.scoreBreakdown} />
                    <DecisionCard decision={data.decision} reasoning={data.reasoning} />
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
