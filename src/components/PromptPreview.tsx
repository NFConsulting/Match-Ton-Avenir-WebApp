import type { ChangeEvent } from 'react'

type PromptPreviewProps = {
  prompt: string
  onChange: (value: string) => void
  onSend: () => void
  loading: boolean
}

const PromptPreview = ({ prompt, onChange, onSend, loading }: PromptPreviewProps) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold text-slate-800">
      Prompt généré (envoyé à l’API)
    </p>
    <textarea
      value={prompt}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      rows={6}
      className="w-full rounded-2xl border border-brand-500/20 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
      placeholder="Le prompt se générera automatiquement après avoir rempli le formulaire."
    />
    <div className="flex justify-end">
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:pointer-events-none disabled:opacity-50"
        onClick={onSend}
        disabled={loading}
      >
        Envoyer ce prompt à l’API
      </button>
    </div>
  </div>
)

export default PromptPreview
