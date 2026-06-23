export default function SearchBox({ value, onChange, onSubmit, loading }) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-glow backdrop-blur-xl sm:p-6"
    >
      <label className="mb-3 block text-sm font-medium text-slate-200" htmlFor="company">
        Company name
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="company"
          name="company"
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Tesla, Apple, Nvidia..."
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </form>
  );
}
