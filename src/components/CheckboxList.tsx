import type { Option } from '../types'

type CheckboxListProps = {
  options: Option[]
  selected: Record<string, boolean>
  onToggle: (label: string) => void
  row?: boolean
  maxSelectable?: number
  selectedCount?: number
}

const CheckboxList = ({
  options,
  selected,
  onToggle,
  row = false,
  maxSelectable,
  selectedCount,
}: CheckboxListProps) => {
  const wrapperClass = row ? 'flex flex-wrap gap-3' : 'space-y-3'
  const itemClass = row
    ? 'inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-brand-500/30'
    : 'flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm transition hover:border-brand-500/30'
  const localSelectedCount = options.filter((opt) => Boolean(selected[opt.label])).length
  const currentSelectedCount = selectedCount ?? localSelectedCount

  return (
    <div className={wrapperClass}>
      {options.map((opt, index) => {
        const slug = opt.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const optionId = `opt-${slug}-${index}`
        const isChecked = Boolean(selected[opt.label])
        const isDisabled = Boolean(maxSelectable && currentSelectedCount >= maxSelectable && !isChecked)
        return (
          <label
            key={`${opt.label}-${index}`}
            htmlFor={optionId}
            className={`${itemClass} ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <input
              id={optionId}
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(opt.label)}
              disabled={isDisabled}
              className={row ? 'h-4 w-4 accent-brand-500' : 'mt-1 h-4 w-4 accent-brand-500'}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">{opt.label}</span>
              {opt.helper && (
                <span className="block text-xs text-slate-600">{opt.helper}</span>
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export default CheckboxList
