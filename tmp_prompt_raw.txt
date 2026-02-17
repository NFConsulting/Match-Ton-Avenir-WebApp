import {
  avatarPostures,
  avatarStyles,
  cognitive,
  developOptions,
  emotional,
  interests,
  social,
} from '../constants/options'
import type { PromptInput } from '../types'

const buildList = (options: string[] | { label: string }[], selected: Record<string, boolean>) =>
  options
    .map((opt) => (typeof opt === 'string' ? opt : opt.label))
    .filter((label) => selected[label])

export const buildPrompt = ({
  strengthsSelected,
  developSelected,
  chosenPostures,
  chosenStyles,
  avatarGender,
  avatarExpression,
  hair,
  avatarTeint,
  avatarWords,
  jobs,
  exploring,
}: PromptInput) => {
  const sportsCompetences = [
    ...buildList(cognitive, strengthsSelected),
    ...buildList(emotional, strengthsSelected),
    ...buildList(social, strengthsSelected),
  ]
  const developCompetences = buildList(developOptions, developSelected)
  const interestList = buildList(interests, strengthsSelected)
  const postures = buildList(avatarPostures, chosenPostures)
  const styles = buildList(avatarStyles, chosenStyles)
  const words = avatarWords.filter(Boolean)
  const jobList = jobs.filter(Boolean)
  const competencesCombined = [...sportsCompetences, ...developCompetences]

  const lines = [
    'Crée un avatar inspirant représentant une personne jeune adulte (environ 30 ans) avec les',
    'traits physiques, compétences et centres d’intérêt suivants :',
    `Genre : ${avatarGender || 'non précisé'}`,
    `Cheveux : ${hair || 'non précisé'}`,
    `Teint : ${avatarTeint || 'non précisé'}`,
    `Expression du visage : ${avatarExpression || 'non précisée'}`,
    `Posture : ${postures.length ? postures.join(', ') : 'non précisée'}`,
    `Style vestimentaire : ${styles.length ? styles.join(', ') : 'non précisé'}`,
    `Mot(s) pour décrire l’avatar : ${words.length ? words.join(', ') : 'non précisés'}`,
    'Le rendu doit être une illustration de type dessin (pas une photo réaliste).',
  ]

  return lines.join('\n')
}
