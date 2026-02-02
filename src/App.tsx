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
import { fetchImageUrls, generateImage } from './services/imageService'
import { buildPrompt } from './utils/prompt'
import type { PromptInput } from './types'

const CloseIcon = (props: ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props}>
    <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z" />
  </SvgIcon>
)

function App() {
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
  const [revisedPrompt, setRevisedPrompt] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [view, setView] = useState<'form' | 'portfolio'>('form')
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [portfolioFetched, setPortfolioFetched] = useState(false)

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

  const submitPrompt = async (prompt: string) => {
    setError(null)
    setRevisedPrompt(undefined)
    setImageUrl('')

    const cleanedPrompt = prompt.trim()
    if (!cleanedPrompt) {
      setError('Complète au moins une section ou saisis un prompt avant de lancer la génération.')
      return
    }

    setLoading(true)
    try {
      const data = await generateImage(cleanedPrompt)
      setImageUrl(data.url)
      setRevisedPrompt(data.revisedPrompt)
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Impossible de contacter le service.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    const prompt = buildPrompt(buildPromptInput())
    setGeneratedPrompt(prompt)
    await submitPrompt(prompt)
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
      const message = fetchError instanceof Error ? fetchError.message : 'Impossible de récupérer les images.'
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
            Aperçu de toutes les images renvoyées par l’API /urls. Clique sur une image pour l’ouvrir
            en grand dans un nouvel onglet.
          </Typography>
          <Button variant="outlined" onClick={() => setView('form')} sx={{ mt: 1 }}>
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
                  Aucune image pour le moment.
                </Typography>
              )}
              {imageUrls.map((url) => (
                <Card key={url} className="portfolio-card" elevation={4} onClick={() => setLightboxUrl(url)}>
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
        <Button variant="outlined" onClick={() => setView('portfolio')} sx={{ mt: 1 }}>
          Ouvrir le portfolio des images
        </Button>
      </Box>

      <Paper elevation={6} className="panel">
        <Stack spacing={4}>
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

          <Divider />

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

          <Divider />

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

          <Divider />

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

          <Divider />

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
              </CardContent>
            </Card>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}

export default App

