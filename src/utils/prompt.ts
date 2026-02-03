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

  const lines = [
    "Crée un avatar inspirant représentant une personne jeune adulte (environ 30 ans) pour un public d'enfants.",
    "Tous les mots dans l'image doivent être en français simple. Pas d'anglais. Si tu hésites, privilégie un pictogramme plutôt que du texte.",
    "Illustrer chaque compétence, centre d'intérêt et métier uniquement par des pictogrammes/icônes/symboles clairs et faciles à comprendre par des enfants.",
    "Place 5 à 6 pictogrammes de métiers autour de l'avatar (sans texte).",
    `Genre : ${avatarGender || 'peu importe'}`,
    `Cheveux : ${hair || 'non précisé'}`,
    `Teint : ${avatarTeint || 'peu importe'}`,
    `Expression du visage : ${avatarExpression || 'calme ou inspiré'}`,
    `Posture : ${postures.length ? postures.join(', ') : 'non précisée'}`,
    `Style vestimentaire : ${styles.length ? styles.join(', ') : 'non précisé'}`,
    `3 mots pour décrire l’avatar : ${words.length ? words.join(', ') : 'non précisés'}`,
    '',
    'Compétences et qualités :',
    `Compétences montrées pendant le sport : ${
      sportsCompetences.length ? sportsCompetences.join(', ') : 'non précisées'
    }`,
    `Compétences à développer : ${
      developCompetences.length ? developCompetences.join(', ') : 'non précisées'
    }`,
    `Centres d’intérêt : ${interestList.length ? interestList.join(', ') : 'non précisés'}`,
    '',
    `Métiers possibles : ${jobList.length ? jobList.join(', ') : exploring ? 'à explorer' : 'à déterminer'}`,
    "Les pictogrammes doivent rester accueillants, positifs et adaptés pour des enfants.",
  ]

  if (exploring && !jobList.length) {
    lines.push('La personne est encore en exploration : proposer des pictogrammes de métiers variés adaptés aux enfants.')
  }

  return lines.join('\n')
}
