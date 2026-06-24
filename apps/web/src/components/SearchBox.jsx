export default function SearchBox({ value, onChange, onSubmit, loading, compact = false }) {
  if (compact) {
    return (
      <form onSubmit={onSubmit} className="relative flex w-full items-center">
        <input
          id="company"
          name="company"
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Search another company..."
          className="glass-input w-full rounded-2xl pl-5 pr-28 py-2.5 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(6,182,212,0.25)] transition-all duration-300 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50"
        >
          {loading ? '...' : 'Analyze'}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass-panel rounded-3xl p-5 sm:p-6 shadow-glow transition-all duration-300 hover:border-cyan-500/20"
    >
      <label className="mb-3 block text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-400" htmlFor="company">
        Enter Company Name
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="company"
          name="company"
          type="text"
          value={value}
          onChange={onChange}
          placeholder="e.g. Tesla, Apple, Google, Nvidia..."
          className="glass-input w-full rounded-2xl px-5 py-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 px-8 py-4 font-bold text-white shadow-[0_4px_20px_-2px_rgba(6,182,212,0.35)] transition-all duration-300 hover:from-cyan-400 hover:via-indigo-400 hover:to-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : 'Analyze Company'}
        </button>
      </div>
    </form>
  );
}
