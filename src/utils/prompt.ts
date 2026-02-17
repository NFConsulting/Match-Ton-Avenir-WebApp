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
    'Compétences et qualités :',
    `Compétences : ${competencesCombined.length ? competencesCombined.join(', ') : 'non précisées'}`,
    `Centres d’intérêt : ${interestList.length ? interestList.join(', ') : 'non précisés'}`,
    `Métiers possibles : ${jobList.length ? jobList.join(', ') : exploring ? 'à explorer' : 'non précisés'}`,
    '',
    "Les compétences et centres d’intérêt doivent influencer l’apparence et les accessoires de l’avatar.",
    'Important : inclure du texte lisible en français dans l’image.',
    'Le texte doit être propre, net, correctement orthographié, sans lettres déformées.',
    'Utiliser une police simple sans-serif, en MAJUSCULES, avec fort contraste sur un fond uni.',
    'Limiter chaque libellé à 1 à 3 mots maximum.',
    'Ne pas inventer de texte hors des informations fournies ci-dessus.',
  ]

  return lines.join('\n')
}
