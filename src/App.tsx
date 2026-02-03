import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material'
import './App.css'
import AvatarSection from './components/AvatarSection'
import CheckboxList from './components/CheckboxList'
import JobsSection from './components/JobsSection'
import PromptPreview from './components/PromptPreview'
import {
  cognitive,
  developOptions,
  emotional,
  interests,
  social,
} from './constants/options'
import { fetchImageUrls, generateImage, generateImageGoogle } from './services/imageService'
import { buildPrompt } from './utils/prompt'
import type { CachedUrl, PromptInput } from './types'

const CloseIcon = (props: ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z" />
  </SvgIcon>
)

function App() {
  const [route, setRoute] = useState<{ view: 'form' | 'portfolio' | 'single'; imageId?: string }>(() => {
    const path = window.location.pathname
    if (path.startsWith('/monImage/')) {
      const id = path.split('/')[2]
      return { view: 'single', imageId: id }
    }
    return { view: 'form' }
  })
  const [strengthsSelected, setStrengthsSelected] = useState<Record<string, boolean>>({})
  const [developSelected, setDevelopSelected] = useState<Record<string, boolean>>({})
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
  const [imageId, setImageId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [view, setView] = useState<'form' | 'portfolio'>('form')
  const [step, setStep] = useState(0)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<CachedUrl[]>([])
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [portfolioFetched, setPortfolioFetched] = useState(false)
  const [singleImageUrl, setSingleImageUrl] = useState<string | null>(null)
  const [singleImageError, setSingleImageError] = useState<string | null>(null)

  const toggleStrength = (label: string) =>
    setStrengthsSelected((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))

  const toggleDevelop = (label: string) =>
    setDevelopSelected((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))

  const togglePosture = (label: string) =>
    setChosenPostures((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))

  const toggleStyle = (label: string) =>
    setChosenStyles((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))

  const counts = useMemo(() => {
    const strengthCount = (options: { label: string }[]) =>
      options.filter((opt) => strengthsSelected[opt.label]).length
    const developCount = (options: { label: string }[]) =>
      options.filter((opt) => developSelected[opt.label]).length
    return {
      cognitive: strengthCount(cognitive),
      emotional: strengthCount(emotional),
      social: strengthCount(social),
      develop: developCount(developOptions),
      interests: strengthCount(interests),
    }
  }, [strengthsSelected, developSelected])

  const hasCognitive = counts.cognitive > 0
  const hasEmotional = counts.emotional > 0
  const hasSocial = counts.social > 0
  const hasStrengthAnswers = hasCognitive && hasEmotional && hasSocial
  const hasDevelopAnswers = counts.develop > 0
  const hasInterestAnswers = counts.interests > 0
  const hasJobAnswer = jobs.some((job) => job.trim().length > 0) || exploring
  const hasAvatarGender = Boolean(avatarGender)
  const hasAvatarExpression = Boolean(avatarExpression)
  const hasAvatarPosture = Object.values(chosenPostures).some(Boolean)
  const hasAvatarHair = Boolean(hair)
  const hasAvatarStyle = Object.values(chosenStyles).some(Boolean)
  const hasAvatarWords = avatarWords.some((w) => w.trim().length > 0)
  const hasAvatarAnswer =
    hasAvatarGender &&
    hasAvatarExpression &&
    hasAvatarPosture &&
    hasAvatarHair &&
    hasAvatarStyle &&
    hasAvatarWords

  const isStepValid = (stepId: string) => {
    switch (stepId) {
      case 'strengths':
        return hasStrengthAnswers
      case 'develop':
        return hasDevelopAnswers
      case 'interests':
        return hasInterestAnswers
      case 'jobs':
        return hasJobAnswer
      case 'avatar':
        return hasAvatarAnswer
      default:
        return true
    }
  }

  const validationMessage: Record<string, string> = {
    strengths: 'Choisis au moins 1 compétence dans chaque catégorie : cognitive, émotionnelle et sociale.',
    develop: 'Sélectionne au moins une compétence à développer.',
    interests: 'Choisis au moins un centre d’intérêt.',
    jobs: 'Renseigne un métier ou coche “Je suis encore en exploration”.',
    avatar:
      'Renseigne genre, expression, posture, cheveux, style vestimentaire et au moins un mot-clé pour l’avatar.',
  }

  const buildPromptInput = (): PromptInput => ({
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
  })

  const friendlyMessage = (message: string, fallback: string) => {
    const lower = message.toLowerCase()
    if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
      return fallback
    }
    return message
  }

  const submitPrompt = async (
    prompt: string,
    generator: (p: string) => Promise<{ url: string; revisedPrompt?: string; id?: string }> = generateImage
  ) => {
    setError(null)
    setImageUrl('')
    setImageId(undefined)

    const cleanedPrompt = prompt.trim()
    if (!cleanedPrompt) {
      setError('Complète au moins une section ou saisis un prompt avant de lancer la génération.')
      return
    }

    setLoading(true)
    try {
      const data = await generator(cleanedPrompt)
      setImageUrl(data.url)
      setImageId(data.id)
      if (data.id) {
        const newUrl = `/monImage/${data.id}`
        window.history.pushState({}, '', newUrl)
        setRoute({ view: 'single', imageId: data.id })
        setView('form') // align view state when switching to single
      }
    } catch (fetchError) {
      const rawMessage = fetchError instanceof Error ? fetchError.message : ''
      const message = friendlyMessage(rawMessage, 'Impossible de contacter le service.')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    const prompt = buildPrompt(buildPromptInput())
    setGeneratedPrompt(prompt)
    await submitPrompt(prompt, generateImage)
  }

  const handleGenerateGoogle = async () => {
    const prompt = buildPrompt(buildPromptInput())
    setGeneratedPrompt(prompt)
    await submitPrompt(prompt, generateImageGoogle)
  }

  const handleSendEditedPrompt = async () => {
    await submitPrompt(generatedPrompt)
  }

  const loadPortfolio = async () => {
    setPortfolioError(null)
    setPortfolioLoading(true)
    setPortfolioFetched(true)
    try {
      const urls = await fetchImageUrls()
      setImageUrls(urls)
    } catch (fetchError) {
      const rawMessage = fetchError instanceof Error ? fetchError.message : ''
      const message = friendlyMessage(rawMessage, 'Impossible de récupérer les images.')
      setPortfolioError(message)
    } finally {
      setPortfolioLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'portfolio' && imageUrls.length === 0 && !portfolioLoading && !portfolioFetched) {
      void loadPortfolio()
    }
  }, [view, imageUrls.length, portfolioLoading, portfolioFetched])

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname
      if (path.startsWith('/monImage/')) {
        const id = path.split('/')[2]
        setRoute({ view: 'single', imageId: id })
        setView('form')
      } else {
        setRoute({ view: 'form' })
        setView('form')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const formSteps = useMemo(
    () => [
      {
        id: 'strengths',
        label: 'Ce que j’ai montré pendant le sport',
        content: (
          <Box className="section-block">
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
                <CheckboxList options={cognitive} selected={strengthsSelected} onToggle={toggleStrength} />
              </Box>
              <Divider />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Compétences émotionnelles — Cœur calme
                  <Chip label={`${counts.emotional} sélection(s)`} size="small" className="count-chip" />
                </Typography>
                <CheckboxList options={emotional} selected={strengthsSelected} onToggle={toggleStrength} />
              </Box>
              <Divider />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Compétences sociales — Bras ouverts
                  <Chip label={`${counts.social} sélection(s)`} size="small" className="count-chip" />
                </Typography>
                <CheckboxList options={social} selected={strengthsSelected} onToggle={toggleStrength} />
              </Box>
            </Stack>
          </Box>
        ),
      },
      {
        id: 'develop',
        label: 'Compétences à développer',
        content: (
          <Box className="section-block">
            <Typography variant="overline" className="section-eyebrow">
              Compétences que j’aimerais développer davantage
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Choisis 1 à 3 compétences que tu souhaites améliorer
            </Typography>
            <Typography variant="h6" gutterBottom>
              <Chip label={`${counts.develop} sélection(s)`} size="small" className="count-chip" />
            </Typography>
            <CheckboxList options={developOptions} selected={developSelected} onToggle={toggleDevelop} />
          </Box>
        ),
      },
      {
        id: 'interests',
        label: 'Centres d’intérêt',
        content: (
          <Box className="section-block">
            <Typography variant="overline" className="section-eyebrow">
              2. MES CENTRES D’INTÉRÊT
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Choisis 1 à 3 centres d’intérêt que tu préfères
            </Typography>
            <Typography variant="h6" gutterBottom>
              <Chip label={`${counts.interests} sélection(s)`} size="small" className="count-chip" />
            </Typography>
            <CheckboxList options={interests} selected={strengthsSelected} onToggle={toggleStrength} />
          </Box>
        ),
      },
      {
        id: 'jobs',
        label: 'Métiers explorés',
        content: (
          <Box className="section-block">
            <Typography variant="overline" className="section-eyebrow">
              3. MÉTIERS QUE J’AI DÉCOUVERTS AUJOURD’HUI
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Écris 1 à 5 métiers qui t’ont le plus intéressé
            </Typography>
            <JobsSection
              jobs={jobs}
              onJobChange={(idx, value) => {
                const next = [...jobs]
                next[idx] = value
                setJobs(next)
              }}
              exploring={exploring}
              onToggleExploring={() => setExploring((prev) => !prev)}
            />
          </Box>
        ),
      },
      {
        id: 'avatar',
        label: 'Détails de l’avatar',
        content: (
          <Box className="section-block">
            <Typography variant="overline" className="section-eyebrow">
              4. À QUOI RESSEMBLE MON AVATAR
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Imagine ton futur toi et complète les infos ci-dessous
            </Typography>

            <AvatarSection
              avatarGender={avatarGender}
              onGenderChange={setAvatarGender}
              avatarExpression={avatarExpression}
              onExpressionChange={setAvatarExpression}
              chosenPostures={chosenPostures}
              onTogglePosture={togglePosture}
              hair={hair}
              onHairChange={setHair}
              chosenStyles={chosenStyles}
              onToggleStyle={toggleStyle}
              avatarTeint={avatarTeint}
              onTeintChange={setAvatarTeint}
              avatarWords={avatarWords}
              onWordChange={(idx, value) => {
                const next = [...avatarWords]
                next[idx] = value
                setAvatarWords(next)
              }}
            />
          </Box>
        ),
      },
      {
        id: 'preview',
        label: 'Prévisualisation & génération',
        content: (
          <Stack spacing={3}>
            <PromptPreview
              prompt={generatedPrompt}
              onChange={setGeneratedPrompt}
              onSend={handleSendEditedPrompt}
              loading={loading}
            />
            {imageUrl && (
              <Card className="image-card" elevation={8}>
                <CardMedia component="img" image={imageUrl} alt="Avatar généré" />
                <CardContent>
                  <Typography variant="subtitle1">Image renvoyée par l’API</Typography>
                  {imageId && (
                    <Typography variant="body2" color="text.secondary">
                      ID : {imageId}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}
          </Stack>
        ),
      },
    ],
    [
      avatarExpression,
      avatarGender,
      avatarTeint,
      avatarWords,
      chosenPostures,
      chosenStyles,
      counts.cognitive,
      counts.develop,
      counts.emotional,
      counts.interests,
      counts.social,
      exploring,
      generatedPrompt,
      hair,
      imageUrl,
      jobs,
      loading,
      strengthsSelected,
      developSelected,
    ]
  )

  const totalSteps = formSteps.length
  const isLastStep = step === totalSteps - 1

  const resetFormState = () => {
    setStrengthsSelected({})
    setDevelopSelected({})
    setJobs(['', '', '', '', ''])
    setExploring(false)
    setAvatarGender('')
    setAvatarExpression('')
    setChosenPostures({})
    setHair('')
    setChosenStyles({})
    setAvatarTeint('')
    setAvatarWords(['', '', ''])
    setGeneratedPrompt('')
    setImageUrl('')
    setImageId(undefined)
    setError(null)
    setLoading(false)
  }

  const goToGenerator = () => {
    window.history.pushState({}, '', '/')
    setRoute({ view: 'form' })
    setView('form')
    setStep(0)
    setLightboxUrl(null)
    setSingleImageUrl(null)
    setSingleImageError(null)
    resetFormState()
  }

  const goToPortfolio = () => {
    window.history.pushState({}, '', '/')
    setRoute({ view: 'form' })
    setView('portfolio')
    setLightboxUrl(null)
  }

  const goNext = () => setStep((prev) => Math.min(prev + 1, totalSteps - 1))
  const goPrev = () => setStep((prev) => Math.max(prev - 1, 0))
  const currentStepId = formSteps[step].id
  const currentStepValid = isStepValid(currentStepId)

  // Single image page: try to resolve url by id
  useEffect(() => {
    const resolveSingleImage = async () => {
      if (route.view !== 'single' || !route.imageId) return

      // If we already have it from last generation or portfolio list
      if (imageId === route.imageId && imageUrl) {
        setSingleImageUrl(imageUrl)
        return
      }
      const cachedHit = imageUrls.find((u) => u.id === route.imageId)
      if (cachedHit) {
        setSingleImageUrl(cachedHit.url)
        return
      }

      setSingleImageError(null)
      setSingleImageUrl(null)
      try {
        const urls = imageUrls.length === 0 ? await fetchImageUrls() : imageUrls
        const found = urls.find((u) => u.id === route.imageId)
        if (found) {
          setImageUrls(urls) // keep cache
          setSingleImageUrl(found.url)
        } else {
          setSingleImageError("Image introuvable avec cet identifiant.")
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Impossible de récupérer l’image.'
        setSingleImageError(msg)
      }
    }

    void resolveSingleImage()
  }, [route, imageId, imageUrl, imageUrls])

  if (route.view === 'single' && route.imageId) {
    return (
      <Container maxWidth="md" className="app-shell">
        <Box className="bg-blob blob1" aria-hidden />
        <Box className="bg-blob blob2" aria-hidden />

        <Box className="hero">
          <Chip label="Match ton Avenir" color="primary" className="chip" />
          <Typography variant="h4" component="h1" className="hero-title">
            Aperçu de l’image
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              onClick={goToGenerator}
            >
              Revenir au générateur
            </Button>
            <Button
              variant="outlined"
              onClick={goToPortfolio}
            >
              Afficher les avatars de mes amis
            </Button>
          </Stack>
        </Box>

        <Paper elevation={6} className="panel">
          {singleImageError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {singleImageError}
            </Alert>
          )}
          {!singleImageUrl && !singleImageError && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}
          {singleImageUrl && (
            <Card className="image-card" elevation={8}>
              <CardMedia component="img" image={singleImageUrl} alt="Avatar généré" />
            </Card>
          )}
        </Paper>
      </Container>
    )
  }

  if (view === 'portfolio') {
    return (
      <Container maxWidth="lg" className="app-shell">
        <Box className="bg-blob blob1" aria-hidden />
        <Box className="bg-blob blob2" aria-hidden />

        <Box className="hero">
          <Chip label="Match ton Avenir" color="primary" className="chip" />
          <Typography variant="h4" component="h1" className="hero-title">
            Portfolio des images générées
          </Typography>
          <Typography variant="body1" className="hero-text">
            Liste des toutes les images générées
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              goToGenerator()
            }}
            sx={{ mt: 1 }}
          >
            Retour au générateur
          </Button>
        </Box>

        <Paper elevation={6} className="panel">
          {portfolioError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {portfolioError}
            </Alert>
          )}
          {portfolioLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box className="portfolio-grid">
              {imageUrls.length === 0 && (
                <Typography variant="body1" color="text.secondary">
                  Il n&apos;y a pas encore d&apos;image pour le moment :(
                </Typography>
              )}
              {imageUrls.map(({ id, url }) => (
                <Card key={id ?? url} className="portfolio-card" elevation={4} onClick={() => setLightboxUrl(url)}>
                  <CardMedia component="img" image={url} alt="Image générée" />
                </Card>
              ))}
            </Box>
          )}
        </Paper>

        <Dialog
          open={Boolean(lightboxUrl)}
          onClose={() => setLightboxUrl(null)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ className: 'lightbox-dialog' }}
        >
          <Box display="flex" justifyContent="flex-end" pr={1} pt={1}>
            <IconButton aria-label="Fermer" onClick={() => setLightboxUrl(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <DialogContent>
            {lightboxUrl && (
              <CardMedia
                component="img"
                image={lightboxUrl}
                alt="Aperçu"
                className="lightbox-image"
              />
            )}
          </DialogContent>
        </Dialog>
      </Container>
    )
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
        <Button variant="outlined" onClick={goToPortfolio} sx={{ mt: 1 }}>
          Ouvrir le portfolio des images
        </Button>
      </Box>

      <Paper elevation={6} className="panel">
        <Stack spacing={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>
              Étape {step + 1} / {totalSteps} — {formSteps[step].label}
            </Typography>
            <Button size="small" onClick={() => setStep(0)} disabled={step === 0}>
              Revenir au début
            </Button>
          </Box>

          {formSteps[step].content}

          <Divider />

          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Button variant="outlined" onClick={goPrev} disabled={step === 0}>
              Précédent
            </Button>
            <Stack direction="row" spacing={2} alignItems="center">
              {!currentStepValid && validationMessage[currentStepId] && (
                <Typography variant="body2" color="error" sx={{ mr: 1 }}>
                  {validationMessage[currentStepId]}
                </Typography>
              )}
              {error && (
                <Alert severity="error" sx={{ mr: 2 }}>
                  {error}
                </Alert>
              )}
              {isLastStep ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="large"
                className="primary-button"
                onClick={handleGenerate}
                disabled={loading}
              >
                Générer mon avatar (DALL·E)
              </Button>
              <Button variant="outlined" size="large" onClick={handleGenerateGoogle} disabled={loading}>
                Générer avec Google
              </Button>
            </Stack>
          ) : (
            <Button variant="contained" onClick={goNext} disabled={!currentStepValid}>
              Étape suivante
            </Button>
          )}
              {loading && <CircularProgress size={24} />}
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}

export default App
