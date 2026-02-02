import type { Option } from '../types'

export const cognitive: Option[] = [
  { label: 'Prise de décision', helper: 'choisir rapidement à qui passer le ballon' },
  { label: 'Résolution de problèmes', helper: 'adapter une stratégie quand la situation change' },
  { label: 'Pensée stratégique', helper: 'décider qui attaque ou défend selon le contexte' },
  { label: 'Attention et concentration', helper: 'rester focus malgré le bruit ou la pression' },
]

export const emotional: Option[] = [
  { label: 'Gestion du stress', helper: 'rester calme quand le point est décisif' },
  { label: 'Maîtrise de soi', helper: "ne pas se laisser emporter par l'échec ou la frustration" },
  { label: 'Confiance en soi', helper: 'oser prendre une initiative' },
  { label: 'Persévérance', helper: "continuer l'effort même après une erreur" },
]

export const social: Option[] = [
  { label: 'Communication', helper: '« Passe ! à gauche ! »' },
  { label: 'Coopération', helper: 'se placer, se relayer, aider un coéquipier' },
  { label: 'Leadership', helper: 'encourager, motiver, donner une impulsion positive au groupe' },
  { label: 'Empathie', helper: "tenir compte du niveau et de l'état des autres joueurs" },
]

export const developOptions: Option[] = [
  { label: 'Prise de décision' },
  { label: 'Résolution de problèmes' },
  { label: 'Pensée stratégique' },
  { label: 'Attention et concentration' },
  { label: 'Gestion du stress' },
  { label: 'Maîtrise de soi' },
  { label: 'Confiance en soi' },
  { label: 'Persévérance' },
  { label: 'Communication' },
  { label: 'Coopération' },
  { label: 'Leadership' },
  { label: 'Empathie' },
]

export const interests: Option[] = [
  { label: 'Numérique / technologie' },
  { label: 'Création (design, vidéo, écriture, musique…)' },
  { label: 'Organisation / gestion de projets' },
  { label: 'Sciences / logique / recherche' },
  { label: 'Activités manuelles / terrain' },
]

export const avatarPostures = [
  'Confiant / droit',
  'Relax / décontracté',
  'En action / prêt à bouger',
  'Pensif / concentré',
  'Explorateur / aventurier',
]

export const avatarStyles = ['Décontracté', 'Sport', 'Créatif', 'Professionnel', 'Futuriste']

export const avatarTeints = ['Clair', 'Moyen', 'Foncé', 'Stylisé', 'Peu importe']
