import CheckboxList from './CheckboxList'
import Emoji from './Emoji'
import { avatarPostures, avatarStyles, avatarTeints } from '../constants/options'

type AvatarSectionProps = {
  avatarGender: string
  onGenderChange: (value: string) => void
  avatarExpression: string
  onExpressionChange: (value: string) => void
  chosenPostures: Record<string, boolean>
  onTogglePosture: (label: string) => void
  hair: string
  onHairChange: (value: string) => void
  chosenStyles: Record<string, boolean>
  onToggleStyle: (label: string) => void
  avatarTeint: string
  onTeintChange: (value: string) => void
  avatarWords: string[]
  onWordChange: (index: number, value: string) => void
}

const AvatarSection = ({
  avatarGender,
  onGenderChange,
  avatarExpression,
  onExpressionChange,
  chosenPostures,
  onTogglePosture,
  hair,
  onHairChange,
  chosenStyles,
  onToggleStyle,
  avatarTeint,
  onTeintChange,
  avatarWords,
  onWordChange,
}: AvatarSectionProps) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">
        <Emoji symbol="👤" /> Genre de l'avatar
      </p>
      <div className="flex flex-wrap gap-3">
        {['Féminin', 'Masculin', 'Peu importe'].map((option) => (
          <label
            key={option}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-brand-500/30"
          >
            <input
              type="radio"
              name="avatarGender"
              value={option}
              checked={avatarGender === option}
              onChange={(event) => onGenderChange(event.target.value)}
              className="h-4 w-4 accent-brand-500"
            />
            {option}
          </label>
        ))}
      </div>
    </div>

    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">
        <Emoji symbol="😊" /> Expression du visage
      </p>
      <div className="flex flex-wrap gap-3">
        {['Confiant', 'Calme', 'Inspiré', 'Curieux'].map((option) => (
          <label
            key={option}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-brand-500/30"
          >
            <input
              type="radio"
              name="avatarExpression"
              value={option}
              checked={avatarExpression === option}
              onChange={(event) => onExpressionChange(event.target.value)}
              className="h-4 w-4 accent-brand-500"
            />
            {option}
          </label>
        ))}
      </div>
    </div>

    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">
        <Emoji symbol="🕺" /> Posture
      </p>
      <CheckboxList
        options={avatarPostures.map((label) => ({ label }))}
        selected={chosenPostures}
        onToggle={onTogglePosture}
        row
      />
    </div>

    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">
        <Emoji symbol="💇" /> Cheveux (longueur, style, couleur si souhaité)
      </p>
      <input
        placeholder="Ex : mi-longs, ondulés, mèches cuivrées"
        value={hair}
        onChange={(event) => onHairChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
      />
    </div>

    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">
        <Emoji symbol="👕" /> Style vestimentaire
      </p>
      <CheckboxList
        options={avatarStyles.map((label) => ({ label }))}
        selected={chosenStyles}
        onToggle={onToggleStyle}
        row
      />
    </div>

    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">
        <Emoji symbol="🎨" /> Teint de l'avatar
      </p>
      <div className="flex flex-wrap gap-3">
        {avatarTeints.map((option) => (
          <label
            key={option}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-brand-500/30"
          >
            <input
              type="radio"
              name="avatarTeint"
              value={option}
              checked={avatarTeint === option}
              onChange={(event) => onTeintChange(event.target.value)}
              className="h-4 w-4 accent-brand-500"
            />
            {option}
          </label>
        ))}
      </div>
    </div>

    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">
        <Emoji symbol="📝" /> 3 mots pour décrire mon avatar
      </p>
      <div className="space-y-2">
        {[0, 1, 2].map((idx) => (
          <label key={idx} className="grid gap-1 text-sm font-medium text-slate-700">
            Mot {idx + 1}
            <input
              value={avatarWords[idx]}
              onChange={(event) => onWordChange(idx, event.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              placeholder={`Mot ${idx + 1}`}
            />
          </label>
        ))}
      </div>
    </div>
  </div>
)

export default AvatarSection
