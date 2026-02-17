import Emoji from './Emoji'

type JobsSectionProps = {
  jobs: string[]
  onJobChange: (index: number, value: string) => void
  exploring: boolean
  onToggleExploring: () => void
}

const JobsSection = ({ jobs, onJobChange, exploring, onToggleExploring }: JobsSectionProps) => (
  <div className="space-y-3">
    {jobs.map((value, idx) => (
      <label key={idx} className="grid gap-1 text-sm font-medium text-slate-700">
        <Emoji symbol="💼" /> Métier {idx + 1}
        <input
          value={value}
          onChange={(event) => onJobChange(idx, event.target.value)}
          className="w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
          placeholder={`Métier ${idx + 1}`}
        />
      </label>
    ))}
    <label className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm">
      <input
        type="checkbox"
        checked={exploring}
        onChange={onToggleExploring}
        className="h-4 w-4 accent-brand-500"
      />
      <span>
        <Emoji symbol="🧭" /> Je suis encore en exploration (et c'est normal)
      </span>
    </label>
  </div>
)

export default JobsSection
