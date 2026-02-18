import { avatarPostures, avatarStyles, cognitive, emotional, social } from '../constants/options'
import type { PromptInput } from '../types'

const buildList = (options: string[] | { label: string }[], selected: Record<string, boolean>) =>
  options
    .map((opt) => (typeof opt === 'string' ? opt : opt.label))
    .filter((label) => selected[label])

const strengthOptions = [...cognitive, ...emotional, ...social]

export const buildPrompt = ({
  strengthsSelected,
  chosenPostures,
  chosenStyles,
  avatarGender,
  avatarExpression,
  hair,
  avatarTeint,
  avatarWords,
}: PromptInput) => {
  const strengths = buildList(strengthOptions, strengthsSelected)
  const postures = buildList(avatarPostures, chosenPostures)
  const styles = buildList(avatarStyles, chosenStyles)
  const words = avatarWords.filter(Boolean)

  const lines = [
    'Crée un avatar inspirant représentant une personne jeune adulte (environ 30 ans) avec les',
    'traits physiques, compétences et centres d’intérêt suivants :',
    `Compétences clés : ${strengths.length ? strengths.join(', ') : 'non précisées'}`,
    'Ces compétences doivent guider l’attitude, la posture et la présence générale de l’avatar.',
    `Genre : ${avatarGender || 'non précisé'}`,
    `Cheveux : ${hair || 'non précisé'}`,
    `Teint : ${avatarTeint || 'non précisé'}`,
    `Expression du visage : ${avatarExpression || 'non précisée'}`,
    `Posture : ${postures.length ? postures.join(', ') : 'non précisée'}`,
    `Style vestimentaire : ${styles.length ? styles.join(', ') : 'non précisé'}`,
    `Mot(s) pour décrire l’avatar : ${words.length ? words.join(', ') : 'non précisés'}`,
    'Le rendu doit être positif et bienveillant, sans violence, sans contenu négatif, menaçant ou choquant.',
    'Le rendu doit être une illustration de type dessin (pas une photo réaliste).',
  ]

  return lines.join('\n')
}
