import {  useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  FormGroup,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import './App.css'

type Option = { label: string; helper?: string }

const cognitive: Option[] = [
  { label: 'Prise de décision', helper: 'choisir rapidement à qui passer le ballon' },
  { label: 'Résolution de problèmes', helper: 'adapter une stratégie quand la situation change' },
  { label: 'Pensée stratégique', helper: 'décider qui attaque ou défend selon le contexte' },
  { label: 'Attention et concentration', helper: 'rester focus malgré le bruit ou la pression' },
]

const emotional: Option[] = [
  { label: 'Gestion du stress', helper: 'rester calme quand le point est décisif' },
  { label: 'Maîtrise de soi', helper: "ne pas se laisser emporter par l'échec ou la frustration" },
  { label: 'Confiance en soi', helper: 'oser prendre une initiative' },
  { label: 'Persévérance', helper: "continuer l'effort même après une erreur" },
]

const social: Option[] = [
  { label: 'Communication', helper: '« Passe ! À gauche ! »' },
  { label: 'Coopération', helper: 'se placer, se relayer, aider un coéquipier' },
  { label: 'Leadership', helper: 'encourager, motiver, donner une impulsion positive au groupe' },
  { label: 'Empathie', helper: "tenir compte du niveau et de l'état des autres joueurs" },
]

const developOptions: Option[] = [
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

const interests: Option[] = [
  { label: 'Numérique / technologie' },
  { label: 'Création (design, vidéo, écriture, musique…)' },
  { label: 'Organisation / gestion de projets' },
  { label: 'Sciences / logique / recherche' },
  { label: 'Activités manuelles / terrain' },
]

const avatarPostures = [
  'Confiant / droit',
  'Relax / décontracté',
  'En action / prêt à bouger',
  'Pensif / concentré',
  'Explorateur / aventurier',
]

const avatarStyles = ['Décontracté', 'Sport', 'Créatif', 'Professionnel', 'Futuriste']

const avatarTeints = ['Clair', 'Moyen', 'Foncé', 'Stylisé', 'Peu importe']

type ImageResponse = {
  url: string
  revisedPrompt?: string
}

function App() {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [jobs, setJobs] = useState<string[]>(['', '', '', '', ''])
  const [exploring, setExploring] = useState(false)
  const [avatarGender, setAvatarGender] = useState('')
  const [avatarExpression, setAvatarExpression] = useState('')
  const [chosenPostures, setChosenPostures] = useState<Record<string, boolean>>({})
  const [hair, setHair] = useState('')
  const [chosenStyles, setChosenStyles] = useState<Record<string, boolean>>({})
  const [avatarTeint, setAvatarTeint] = useState('')
  const [avatarWords, setAvatarWords] = useState<string[]>(['', '', ''])
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [revisedPrompt, setRevisedPrompt] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (label: string) => {
    setSelected((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  const toggleMap = (
    label: string,
    updater: Dispatch<SetStateAction<Record<string, boolean>>>,
  ) => {
    updater((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  const counts = useMemo(() => {
    const groupCount = (options: Option[]) => options.filter((opt) => selected[opt.label]).length
    return {
      cognitive: groupCount(cognitive),
      emotional: groupCount(emotional),
      social: groupCount(social),
      develop: groupCount(developOptions),
      interests: groupCount(interests),
    }
  }, [selected])

  const renderOptions = (options: Option[]) => (
    <FormGroup>
      {options.map((opt) => (
        <FormControlLabel
          key={opt.label}
          control={<Checkbox checked={Boolean(selected[opt.label])} onChange={() => toggle(opt.label)} />}
          label={
            <Box>
              <Typography variant="body1" fontWeight={600}>
                {opt.label}
              </Typography>
              {opt.helper && (
                <Typography variant="body2" color="text.secondary">
                  {opt.helper}
                </Typography>
              )}
            </Box>
          }
        />
      ))}
    </FormGroup>
  )

  const buildList = (options: Option[]) =>
    options.filter((opt) => selected[opt.label]).map((opt) => opt.label)

  const buildPrompt = () => {
    const sportsCompetences = [
      ...buildList(cognitive),
      ...buildList(emotional),
      ...buildList(social),
    ]
    const developCompetences = buildList(developOptions)
    const interestList = buildList(interests)
    const postures = Object.entries(chosenPostures)
      .filter(([, isChecked]) => isChecked)
      .map(([label]) => label)
    const styles = Object.entries(chosenStyles)
      .filter(([, isChecked]) => isChecked)
      .map(([label]) => label)
    const words = avatarWords.filter(Boolean)
    const jobList = jobs.filter(Boolean)

    const lines = [
      "Crée un avatar inspirant représentant une personne jeune adulte (environ 30 ans) pour un public d'enfants.",
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
      `Métiers possibles : ${
        jobList.length ? jobList.join(', ') : exploring ? 'à explorer' : 'à déterminer'
      }`,
      'Affiche à côté ou autour de l’avatar 5 à 6 métiers correspondant à ce profil, en lien avec ses compétences, qualités et centres d’intérêt.',
      "Les compétences et centres d’intérêt doivent influencer l’apparence et les accessoires de l’avatar.",
      "Le visuel doit rester accueillant, positif et adapté pour des enfants.",
    ]

    if (exploring && !jobList.length) {
      lines.push("La personne est encore en exploration : proposer des pistes variées adaptées aux enfants.")
    }

    return lines.join('\n')
  }

  const handleGenerate = async () => {
    const prompt = buildPrompt()
    setGeneratedPrompt(prompt)
    setError(null)
    setRevisedPrompt(undefined)
    setImageUrl('')

    if (!prompt.trim()) {
      setError('Complète au moins une section pour générer un prompt.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('https://matchtonavenir-api-bxd2h0dnd3h9d2de.francecentral-01.azurewebsites.net/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error(`Requête échouée (${response.status})`)
      }

      const data: ImageResponse = await response.json()
      if (!data.url) {
        throw new Error('La réponse ne contient pas de champ "url".')
      }

      setImageUrl(data.url)
      setRevisedPrompt(data.revisedPrompt)
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Impossible de contacter le service.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" className="app-shell">
      <Box className="bg-blob blob1" aria-hidden />
      <Box className="bg-blob blob2" aria-hidden />

      <Box className="hero">
        <Chip label="Match ton Avenir" color="primary" className="chip" />
        <Typography variant="h2" component="h1" className="hero-title">
          JE CRÉE MON AVATAR – MATCH TON AVENIR
        </Typography>
        <Typography variant="h5" component="h2" className="hero-subtitle">
          Et si tu pouvais rencontrer ton futur toi ?
        </Typography>
        <Typography variant="body1" className="hero-text">
          Match ton Avenir est un espace pour explorer, tester et imaginer. Prends 5 à 10 minutes
          pour répondre aux questions, et découvre ton avatar du futur, créé à partir de tes
          compétences, de tes expériences sportives et de tes centres d’intérêt.
        </Typography>
      </Box>

      <Paper elevation={6} className="panel">
        <Stack spacing={4}>
          <Box>
            <Typography variant="overline" className="section-eyebrow">
              1. CE QUE J’AI MONTRÉ PENDANT LE SPORT
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Choisis 3 à 5 compétences que tu as le plus montrées
            </Typography>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Compétences cognitives — Esprit clair
                  <Chip label={`${counts.cognitive} sélection(s)`} size="small" className="count-chip" />
                </Typography>
                {renderOptions(cognitive)}
              </Box>
              <Divider />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Compétences émotionnelles — Cœur calme
                  <Chip label={`${counts.emotional} sélection(s)`} size="small" className="count-chip" />
                </Typography>
                {renderOptions(emotional)}
              </Box>
              <Divider />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Compétences sociales — Bras ouverts
                  <Chip label={`${counts.social} sélection(s)`} size="small" className="count-chip" />
                </Typography>
                {renderOptions(social)}
              </Box>
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="overline" className="section-eyebrow">
              Compétences que j’aimerais développer davantage
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Choisis 1 à 3 compétences que tu souhaites améliorer
            </Typography>
            <Typography variant="h6" gutterBottom>
              <Chip label={`${counts.develop} sélection(s)`} size="small" className="count-chip" />
            </Typography>
            {renderOptions(developOptions)}
          </Box>

          <Divider />

          <Box>
            <Typography variant="overline" className="section-eyebrow">
              2. MES CENTRES D’INTÉRÊT
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Choisis 1 à 3 centres d’intérêt que tu préfères
            </Typography>
            <Typography variant="h6" gutterBottom>
              <Chip label={`${counts.interests} sélection(s)`} size="small" className="count-chip" />
            </Typography>
            {renderOptions(interests)}
          </Box>

          <Divider />

          <Box>
            <Typography variant="overline" className="section-eyebrow">
              3. MÉTIERS QUE J’AI DÉCOUVERTS AUJOURD’HUI
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Écris 1 à 5 métiers qui t’ont le plus intéressé
            </Typography>
            <Stack spacing={1.5}>
              {[0, 1, 2, 3, 4].map((idx) => (
                <TextField
                  key={idx}
                  label={`Métier ${idx + 1}`}
                  value={jobs[idx]}
                  onChange={(event) => {
                    const next = [...jobs]
                    next[idx] = event.target.value
                    setJobs(next)
                  }}
                  fullWidth
                  size="small"
                />
              ))}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exploring}
                    onChange={() => setExploring((prev) => !prev)}
                  />
                }
                label="Je suis encore en exploration (et c’est normal)"
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="overline" className="section-eyebrow">
              4. À QUOI RESSEMBLE MON AVATAR
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Imagine ton futur toi et complète les infos ci-dessous
            </Typography>

            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Genre de l’avatar
                </Typography>
                <RadioGroup
                  row
                  value={avatarGender}
                  onChange={(event) => setAvatarGender(event.target.value)}
                >
                  {['Féminin', 'Masculin', 'Peu importe'].map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Expression du visage
                </Typography>
                <RadioGroup
                  row
                  value={avatarExpression}
                  onChange={(event) => setAvatarExpression(event.target.value)}
                >
                  {['Confiant', 'Calme', 'Inspiré', 'Curieux'].map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Posture
                </Typography>
                <FormGroup row>
                  {avatarPostures.map((option) => (
                    <FormControlLabel
                      key={option}
                      control={
                        <Checkbox
                          checked={Boolean(chosenPostures[option])}
                          onChange={() => toggleMap(option, setChosenPostures)}
                        />
                      }
                      label={option}
                    />
                  ))}
                </FormGroup>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Cheveux (longueur, style, couleur si souhaité)
                </Typography>
                <TextField
                  placeholder="Ex : mi-longs, ondulés, mèches cuivrées"
                  value={hair}
                  onChange={(event) => setHair(event.target.value)}
                  fullWidth
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Style vestimentaire
                </Typography>
                <FormGroup row>
                  {avatarStyles.map((option) => (
                    <FormControlLabel
                      key={option}
                      control={
                        <Checkbox
                          checked={Boolean(chosenStyles[option])}
                          onChange={() => toggleMap(option, setChosenStyles)}
                        />
                      }
                      label={option}
                    />
                  ))}
                </FormGroup>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Teint de l’avatar (optionnel)
                </Typography>
                <RadioGroup
                  row
                  value={avatarTeint}
                  onChange={(event) => setAvatarTeint(event.target.value)}
                >
                  {avatarTeints.map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  3 mots pour décrire mon avatar
                </Typography>
                <Stack spacing={1.2}>
                  {[0, 1, 2].map((idx) => (
                    <TextField
                      key={idx}
                      label={`Mot ${idx + 1}`}
                      value={avatarWords[idx]}
                      onChange={(event) => {
                        const next = [...avatarWords]
                        next[idx] = event.target.value
                        setAvatarWords(next)
                      }}
                      fullWidth
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Box className="action-row">
              <Button
                variant="contained"
                size="large"
                className="primary-button"
                onClick={handleGenerate}
                disabled={loading}
              >
                Générer l’avatar (prompt + image)
              </Button>
              {loading && <CircularProgress size={24} />}
            </Box>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {revisedPrompt && !error && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Reformulation API : {revisedPrompt}
              </Alert>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Prompt généré (envoyé à l’API)
            </Typography>
            <TextField
              value={generatedPrompt}
              onChange={(event) => setGeneratedPrompt(event.target.value)}
              multiline
              minRows={6}
              fullWidth
              className="prompt-preview"
              placeholder="Le prompt se générera automatiquement après avoir rempli le formulaire."
            />
          </Box>

          {imageUrl && (
            <Card className="image-card" elevation={8}>
              <CardMedia component="img" image={imageUrl} alt="Avatar généré" />
              <CardContent>
                <Typography variant="subtitle1">Image renvoyée par l’API</Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}

export default App
