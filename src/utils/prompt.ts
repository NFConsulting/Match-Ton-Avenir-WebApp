import {
  avatarPostures,
  avatarStyles,
  cognitive,
  emotional,
  interests,
  social,
} from '../constants/options'
import type { CareersRequest, PromptInput } from '../types'

const buildList = (options: string[] | { label: string }[], selected: Record<string, boolean>) =>
  options
    .map((opt) => (typeof opt === 'string' ? opt : opt.label))
    .filter((label) => selected[label])

const strengthOptions = [...cognitive, ...emotional, ...social]

const buildJobsList = (jobs: string[], exploring: boolean) => {
  const selectedJobs = jobs.map((job) => job.trim()).filter(Boolean)
  if (selectedJobs.length > 0) return selectedJobs
  return exploring ? ['En exploration'] : []
}

const buildJobsText = (jobs: string[], exploring: boolean) => {
  const selectedJobs = buildJobsList(jobs, exploring)
  if (selectedJobs.length > 0) return selectedJobs.join(', ')
  return exploring ? 'encore en exploration' : 'non précisés'
}

export const buildCareersPayload = ({
  strengthsSelected,
  jobs,
  exploring,
}: PromptInput): CareersRequest => ({
  metiers: buildJobsList(jobs, exploring),
  centresInteret: buildList(interests, strengthsSelected),
})

export const buildPrompt = ({
  strengthsSelected,
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
  const strengths = buildList(strengthOptions, strengthsSelected)
  const selectedInterests = buildList(interests, strengthsSelected)
  const postures = buildList(avatarPostures, chosenPostures)
  const styles = buildList(avatarStyles, chosenStyles)
  const words = avatarWords.filter(Boolean)
  const jobsText = buildJobsText(jobs, exploring)

  const lines = [
    'Crée un avatar inspirant représentant une personne jeune adulte (environ 30 ans) avec les',
    'traits physiques, compétences et centres d’intérêt suivants :',
    `Compétences clés : ${strengths.length ? strengths.join(', ') : 'non précisées'}`,
    `Centres d’intérêt : ${selectedInterests.length ? selectedInterests.join(', ') : 'non précisés'}`,
    `Métiers envisagés : ${jobsText}`,
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
