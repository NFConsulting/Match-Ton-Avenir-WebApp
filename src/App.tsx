import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
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
import { fetchImageUrlsPage, generateImage, generateImageGoogle } from './services/imageService'
import { buildPrompt } from './utils/prompt'
import type { CachedUrl, PromptInput } from './types'

const MAX_STRENGTHS = 5
const MAX_DEVELOP = 3
const MAX_INTERESTS = 3
const strengthLabels = [...cognitive, ...emotional, ...social].map((option) => option.label)
const strengthLabelSet = new Set(strengthLabels)
const developLabels = developOptions.map((option) => option.label)
const developLabelSet = new Set(developLabels)

const CloseIcon = (props: ComponentProps<'svg'>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z" />
  </svg>
)

const containerBase = 'relative mx-auto w-full px-4 sm:px-6 lg:px-8'
const containerMd = `${containerBase} max-w-5xl`
const containerLg = `${containerBase} max-w-6xl`
const appShell = 'flex min-h-screen flex-col gap-7 py-12'

const heroClass =
  'flex flex-col gap-3 rounded-2xl bg-[linear-gradient(135deg,rgb(var(--brand-500)/0.14),rgba(151,151,151,0.18))] px-6 py-7 shadow-[0_12px_40px_rgba(0,0,0,0.14)]'
const panelClass =
  'rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.12)] backdrop-blur'
const sectionBlockClass =
  'rounded-2xl border border-brand-500/10 bg-[linear-gradient(135deg,rgb(var(--brand-500)/0.05),rgba(151,151,151,0.08))] p-5 transition hover:border-brand-500/20 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]'
const eyebrowClass = 'text-xs font-bold uppercase tracking-[0.2em] text-brand-500'
const chipClass =
  'inline-flex w-fit items-center rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white'
const countChipClass =
  'inline-flex items-center rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-900'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 disabled:pointer-events-none disabled:opacity-50'
const buttonPrimary =
  `${buttonBase} bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_10px_24px_rgba(211,8,116,0.35)] hover:from-brand-600 hover:to-brand-700`
const buttonPrimaryLarge =
  `${buttonPrimary} px-5 py-3 text-base shadow-[0_12px_28px_rgba(211,8,116,0.45)]`
const buttonOutline =
  `${buttonBase} border border-slate-200 bg-white/80 text-slate-900 hover:bg-white`

const spinner = (
  <div className="flex justify-center py-8">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
  </div>
)

const errorBoxClass = 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
const GALLERY_PAGE_SIZE = 12

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
  const [jobs, setJobs] = useState<string[]>(['', '', ''])
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
  const [portfolioReloadKey, setPortfolioReloadKey] = useState(0)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [singleImageUrl, setSingleImageUrl] = useState<string | null>(null)
  const [singleImageError, setSingleImageError] = useState<string | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [portfolioAfterId, setPortfolioAfterId] = useState(0)
  const [portfolioHasMore, setPortfolioHasMore] = useState(true)
  const [portfolioLoadingMore, setPortfolioLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const toggleStrength = (label: string) =>
    setStrengthsSelected((prev) => {
      const isSelected = Boolean(prev[label])
      if (isSelected) {
        return {
          ...prev,
          [label]: false,
        }
      }

      if (!strengthLabelSet.has(label)) {
        return {
          ...prev,
          [label]: true,
        }
      }

      const selectedStrengths = strengthLabels.filter((item) => prev[item]).length
      if (selectedStrengths >= MAX_STRENGTHS) {
        return prev
      }

      return {
        ...prev,
        [label]: true,
      }
    })

  const toggleDevelop = (label: string) =>
    setDevelopSelected((prev) => {
      const isSelected = Boolean(prev[label])
      if (isSelected) {
        return {
          ...prev,
          [label]: false,
        }
      }

      if (!developLabelSet.has(label)) {
        return {
          ...prev,
          [label]: true,
        }
      }

      const selectedDevelop = developLabels.filter((item) => prev[item]).length
      if (selectedDevelop >= MAX_DEVELOP) {
        return prev
      }

      return {
        ...prev,
        [label]: true,
      }
    })

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
  const strengthSelectionCount = counts.cognitive + counts.emotional + counts.social
  const hasStrengthAnswers = hasCognitive && hasEmotional && hasSocial
  const hasDevelopAnswers = counts.develop > 0
  const hasInterestAnswers = counts.interests > 0
  const hasJobAnswer = jobs.some((job) => job.trim().length > 0) || exploring
  const hasAvatarGender = Boolean(avatarGender)
  const hasAvatarExpression = Boolean(avatarExpression)
  const hasAvatarPosture = Object.values(chosenPostures).some(Boolean)
  const hasAvatarHair = Boolean(hair)
  const hasAvatarTeint = Boolean(avatarTeint)
  const hasAvatarStyle = Object.values(chosenStyles).some(Boolean)
  const hasAvatarAnswer =
    hasAvatarGender &&
    hasAvatarExpression &&
    hasAvatarPosture &&
    hasAvatarHair &&
    hasAvatarTeint &&
    hasAvatarStyle

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
      'Renseigne genre, expression, posture, cheveux, teint et style vestimentaire pour l’avatar.',
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

  const buildImageFilename = (candidateId?: string | number | null) => {
    const normalizedId = String(candidateId ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (normalizedId) {
      return `match-ton-avenir-${normalizedId}.png`
    }

    const dateStamp = new Date().toISOString().slice(0, 10)
    return `match-ton-avenir-${dateStamp}.png`
  }

  const handleDownloadImage = useCallback(
    async (targetUrl: string | null | undefined, candidateId?: string | number | null) => {
      const url = String(targetUrl ?? '').trim()
      if (!url) return

      const filename = buildImageFilename(candidateId)

      const clickDownloadLink = (href: string, openInNewTab = false) => {
        const link = document.createElement('a')
        link.href = href
        link.download = filename
        link.rel = 'noopener'
        if (openInNewTab) {
          link.target = '_blank'
        }
        document.body.appendChild(link)
        link.click()
        link.remove()
      }

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('download_failed')
        }

        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        clickDownloadLink(blobUrl)
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      } catch {
        clickDownloadLink(url, true)
      }
    },
    []
  )

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
      const normalizedImageId = data.id !== undefined && data.id !== null ? String(data.id) : undefined
      setImageId(normalizedImageId)
      if (normalizedImageId) {
        const newUrl = `/monImage/${normalizedImageId}`
        window.history.pushState({}, '', newUrl)
        setRoute({ view: 'single', imageId: normalizedImageId })
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

  const loadPortfolioPage = useCallback(
    async (targetAfterId: number, replace = false) => {
      setPortfolioError(null)

      if (replace) {
        setPortfolioLoading(true)
      } else {
        setPortfolioLoadingMore(true)
      }

      try {
        const result = await fetchImageUrlsPage({
          afterId: targetAfterId,
          limit: GALLERY_PAGE_SIZE,
          includeUrl: true,
        })

        setImageUrls((prev) => {
          const base = replace ? [] : prev
          const unique = new Map<string, CachedUrl>()

          for (const item of base) {
            unique.set(item.id || item.url, item)
          }
          for (const item of result.items) {
            unique.set(item.id || item.url, item)
          }

          return Array.from(unique.values())
        })

        setPortfolioAfterId(result.nextAfterId)
        setPortfolioHasMore(result.hasMore)
      } catch (fetchError) {
        const rawMessage = fetchError instanceof Error ? fetchError.message : ''
        const message = friendlyMessage(rawMessage, 'Impossible de recuperer les images.')
        setPortfolioError(message)
      } finally {
        if (replace) {
          setPortfolioLoading(false)
        } else {
          setPortfolioLoadingMore(false)
        }
      }
    },
    []
  )

  const loadPortfolio = useCallback(async () => {
    setImageUrls([])
    setPortfolioAfterId(0)
    setPortfolioHasMore(true)
    await loadPortfolioPage(0, true)
  }, [loadPortfolioPage])

  useEffect(() => {
    if (view === 'portfolio') {
      void loadPortfolio()
    }
  }, [view, portfolioReloadKey, loadPortfolio])

  useEffect(() => {
    if (view !== 'portfolio' || !portfolioHasMore || portfolioLoading || portfolioLoadingMore) return
    const target = loadMoreRef.current
    if (!target) return

    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        if (portfolioLoading || portfolioLoadingMore || !portfolioHasMore) return
        void loadPortfolioPage(portfolioAfterId)
      },
      { rootMargin: '200px' }
    )
    observerRef.current.observe(target)

    return () => observerRef.current?.disconnect()
  }, [view, portfolioHasMore, portfolioLoading, portfolioLoadingMore, portfolioAfterId, loadPortfolioPage])

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
        label: '🏅 Ce que j’ai montré pendant le sport',
        content: (
          <div className={sectionBlockClass}>
            <p className={eyebrowClass}>1. 🏅 CE QUE J’AI MONTRÉ PENDANT LE SPORT</p>
            <p className="mt-2 text-sm text-slate-600">
              Choisis 3 à 5 compétences que tu as le plus montrées
            </p>
            <div className="mt-5 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  🧠 Compétences cognitives — Esprit clair
                  <span className={`${countChipClass} ml-3`}>{counts.cognitive} sélection(s)</span>
                </h3>
                <div className="mt-3">
                  <CheckboxList
                    options={cognitive}
                    selected={strengthsSelected}
                    onToggle={toggleStrength}
                    maxSelectable={MAX_STRENGTHS}
                    selectedCount={strengthSelectionCount}
                  />
                </div>
              </div>
              <div className="h-px bg-slate-200/80" />
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  ❤️ Compétences émotionnelles — Cœur calme
                  <span className={`${countChipClass} ml-3`}>{counts.emotional} sélection(s)</span>
                </h3>
                <div className="mt-3">
                  <CheckboxList
                    options={emotional}
                    selected={strengthsSelected}
                    onToggle={toggleStrength}
                    maxSelectable={MAX_STRENGTHS}
                    selectedCount={strengthSelectionCount}
                  />
                </div>
              </div>
              <div className="h-px bg-slate-200/80" />
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  🤝 Compétences sociales — Bras ouverts
                  <span className={`${countChipClass} ml-3`}>{counts.social} sélection(s)</span>
                </h3>
                <div className="mt-3">
                  <CheckboxList
                    options={social}
                    selected={strengthsSelected}
                    onToggle={toggleStrength}
                    maxSelectable={MAX_STRENGTHS}
                    selectedCount={strengthSelectionCount}
                  />
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'develop',
        label: '📈 Compétences à développer',
        content: (
          <div className={sectionBlockClass}>
            <p className={eyebrowClass}>📈 Tes compétences sont évolutives, qu’aimerais tu développer davantage ?</p>
            <p className="mt-2 text-sm text-slate-600">
              Choisis 1 à 3 compétences que tu souhaites améliorer
            </p>
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              Sélections
              <span className={`${countChipClass} ml-3`}>{counts.develop} sélection(s)</span>
            </h3>
            <div className="mt-3">
              <CheckboxList
                options={developOptions}
                selected={developSelected}
                onToggle={toggleDevelop}
                maxSelectable={MAX_DEVELOP}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'interests',
        label: '💡 Centres d’intérêt',
        content: (
          <div className={sectionBlockClass}>
            <p className={eyebrowClass}>2. 💡 MES CENTRES D’INTÉRÊT</p>
            <p className="mt-2 text-sm text-slate-600">
              Choisis 1 à 3 centres d’intérêt que tu préfères
            </p>
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              Sélections
              <span className={`${countChipClass} ml-3`}>{counts.interests} sélection(s)</span>
            </h3>
            <div className="mt-3">
              <CheckboxList
                options={interests}
                selected={strengthsSelected}
                onToggle={toggleStrength}
                maxSelectable={MAX_INTERESTS}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'jobs',
        label: '🧭 Métiers explorés',
        content: (
          <div className={sectionBlockClass}>
            <p className={eyebrowClass}>3. 🧭 MÉTIERS SUR LESQUELS JE ME PROJETTE :</p>
            <p className="mt-2 text-sm text-slate-600">
              Écris 1 à 3 métiers qui t’ont le plus intéressé
            </p>
            <div className="mt-4">
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
            </div>
          </div>
        ),
      },
      {
        id: 'avatar',
        label: '🧑‍🚀 Détails de l’avatar',
        content: (
          <div className={sectionBlockClass}>
            <p className={eyebrowClass}>4. 🧑‍🚀 À QUOI RESSEMBLE MON AVATAR</p>
            <p className="mt-2 text-sm text-slate-600">
              Imagine ton futur toi et complète les infos ci-dessous
            </p>

            <div className="mt-5">
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
            </div>
          </div>
        ),
      },
      {
        id: 'preview',
        label: '🎨 Prévisualisation & génération',
        content: (
          <div className="space-y-4">
            <PromptPreview
              prompt={generatedPrompt}
              onChange={setGeneratedPrompt}
              onSend={handleSendEditedPrompt}
              loading={loading}
            />
            {imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.12)]">
                <img src={imageUrl} alt="Avatar généré" className="h-full w-full object-cover" />
                <div className="space-y-1 px-5 py-4">
                  <p className="text-base font-semibold text-slate-900">🖼️ Image renvoyée par l’API</p>
                  {imageId && (
                    <p className="text-sm text-slate-600">
                      ID : {imageId}
                    </p>
                  )}
                  <div className="pt-2">
                    <button
                      type="button"
                      className={buttonOutline}
                      onClick={() => void handleDownloadImage(imageUrl, imageId)}
                    >
                      ⬇️ Télécharger l&apos;image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
      handleDownloadImage,
      hair,
      imageId,
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
    setJobs(['', '', ''])
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

  const goNext = () => setStep((prev) => Math.min(prev + 1, totalSteps - 1))
  const goPrev = () => setStep((prev) => Math.max(prev - 1, 0))
  const currentStepId = formSteps[step].id
  const currentStepValid = isStepValid(currentStepId)
  const handleNext = () => {
    if (currentStepValid) {
      goNext()
      return
    }
    setShowValidation(true)
  }

  useEffect(() => {
    setShowValidation(false)
  }, [step])

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
        if (imageUrls.length > 0) {
          const found = imageUrls.find((u) => u.id === route.imageId)
          if (found) {
            setSingleImageUrl(found.url)
            return
          }
        }

        let page = 1
        let hasMore = true
        let afterId = 0
        const searchCache: CachedUrl[] = []

        while (hasMore && page <= 10) {
          const result = await fetchImageUrlsPage({ afterId, limit: 50, includeUrl: true })
          searchCache.push(...result.items)

          const found = result.items.find((u) => u.id === route.imageId)
          if (found) {
            setImageUrls(searchCache)
            setSingleImageUrl(found.url)
            return
          }

          hasMore = result.hasMore
          if (result.nextAfterId <= afterId) {
            break
          }
          afterId = result.nextAfterId
          page += 1
        }

        setSingleImageError('Image introuvable avec cet identifiant.')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Impossible de récupérer l’image.'
        setSingleImageError(msg)
      }
    }

    void resolveSingleImage()
  }, [route, imageId, imageUrl, imageUrls])

  if (route.view === 'single' && route.imageId) {
    return (
      <main className={`${containerMd} ${appShell}`}>
        <div className="pointer-events-none absolute right-[-120px] top-[-60px] h-[320px] w-[320px] rounded-full bg-[rgb(var(--brand-500)/0.28)] blur-[48px] opacity-70" aria-hidden />
        <div className="pointer-events-none absolute bottom-[-80px] left-[-100px] h-[280px] w-[280px] rounded-full bg-[rgba(151,151,151,0.22)] blur-[48px] opacity-70" aria-hidden />

        <section className={heroClass}>
          <span className={chipClass}>Match ton Avenir</span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            🖼️ Aperçu de l’image
          </h1>
          <div className="flex flex-wrap gap-3 pt-1">
            <button className={buttonPrimary} onClick={goToGenerator}>
              ↩️ Revenir au générateur
            </button>
            {singleImageUrl && (
              <button
                type="button"
                className={buttonOutline}
                onClick={() => void handleDownloadImage(singleImageUrl, route.imageId)}
              >
                ⬇️ Télécharger l&apos;image
              </button>
            )}
          </div>
        </section>

        <section className={panelClass}>
          {singleImageError && (
            <div className={`${errorBoxClass} mb-3`}>
              {singleImageError}
            </div>
          )}
          {!singleImageUrl && !singleImageError && spinner}
          {singleImageUrl && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
              <img src={singleImageUrl} alt="Avatar généré" className="h-full w-full object-cover" />
            </div>
          )}
        </section>
      </main>
    )
  }

  if (view === 'portfolio') {
    return (
      <main className={`${containerLg} ${appShell}`}>
        <div className="pointer-events-none absolute right-[-120px] top-[-60px] h-[320px] w-[320px] rounded-full bg-[rgb(var(--brand-500)/0.28)] blur-[48px] opacity-70" aria-hidden />
        <div className="pointer-events-none absolute bottom-[-80px] left-[-100px] h-[280px] w-[280px] rounded-full bg-[rgba(151,151,151,0.22)] blur-[48px] opacity-70" aria-hidden />

        <section className={heroClass}>
          <span className={chipClass}>Match ton Avenir</span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            🗂️ Galerie des images générées
          </h1>
          <p className="text-sm text-slate-600">
            ✨ Liste de toutes les images générées
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              className={buttonOutline}
              onClick={() => {
                goToGenerator()
              }}
            >
              ↩️ Retour au générateur
            </button>
            <button
              className={buttonPrimary}
              onClick={() => setPortfolioReloadKey((prev) => prev + 1)}
              disabled={portfolioLoading}
            >
              🔄 Rafraîchir la liste
            </button>
          </div>
        </section>

        <section className={panelClass}>
          {portfolioError && (
            <div className={`${errorBoxClass} mb-3`}>
              {portfolioError}
            </div>
          )}
          {portfolioLoading ? (
            spinner
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                {imageUrls.length === 0 && (
                  <p className="text-sm text-slate-500">
                    😶 Il n&apos;y a pas encore d&apos;image pour le moment :(
                  </p>
                )}
                {imageUrls.map(({ id, url }) => (
                  <button
                    key={id ?? url}
                    type="button"
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
                    onClick={() => setLightboxUrl(url)}
                  >
                    <img
                      src={url}
                      alt="Image générée"
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  </button>
                ))}
              </div>
              {portfolioLoadingMore && (
                <div className="flex justify-center py-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
                </div>
              )}
              {portfolioHasMore && <div ref={loadMoreRef} className="h-8" />}
            </>
          )}
        </section>

        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxUrl(null)}
          >
            <div
              className="relative w-full max-w-5xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-900 shadow-lg transition hover:bg-white"
                aria-label="Fermer"
                onClick={() => setLightboxUrl(null)}
              >
                <CloseIcon className="h-4 w-4" />
              </button>
              <img
                src={lightboxUrl}
                alt="Aperçu"
                className="max-h-[80vh] w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className={`${containerMd} ${appShell}`}>
      <div className="pointer-events-none absolute right-[-120px] top-[-60px] h-[320px] w-[320px] rounded-full bg-[rgb(var(--brand-500)/0.28)] blur-[48px] opacity-70" aria-hidden />
      <div className="pointer-events-none absolute bottom-[-80px] left-[-100px] h-[280px] w-[280px] rounded-full bg-[rgba(151,151,151,0.22)] blur-[48px] opacity-70" aria-hidden />

      <section className={heroClass}>
        <span className={chipClass}>Match ton Avenir</span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          JE CRÉE MON AVATAR – MATCH TON AVENIR 🚀
        </h1>
        <p className="text-lg font-semibold text-slate-900">
          Et si tu pouvais rencontrer ton futur toi ? ✨
        </p>
        <p className="text-sm text-slate-600 sm:text-base">
          Match ton Avenir est un espace pour explorer, tester et imaginer. Prends 5 à 10 minutes
          pour répondre aux questions, et découvre ton avatar du futur, créé à partir de tes
          compétences, de tes expériences sportives et de tes centres d’intérêt.
        </p>
      </section>

      <section className={panelClass}>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">
              🧩 Étape {step + 1} / {totalSteps}
            </p>
            <button className={buttonOutline} onClick={() => setStep(0)} disabled={step === 0}>
              Revenir au début
            </button>
          </div>

          {formSteps[step].content}

          <div className="h-px bg-slate-200/80" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button className={buttonOutline} onClick={goPrev} disabled={step === 0}>
                Précédent
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {showValidation && !currentStepValid && validationMessage[currentStepId] && (
                <p className="text-sm text-red-600">
                  {validationMessage[currentStepId]}
                </p>
              )}
              {error && (
                <div className={errorBoxClass}>
                  {error}
                </div>
              )}
              {isLastStep ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className={buttonPrimaryLarge}
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    🎯 Générer mon avatar (DALL·E)
                  </button>
                  <button
                    className={buttonOutline}
                    onClick={handleGenerateGoogle}
                    disabled={loading}
                  >
                    ✨ Générer avec Google
                  </button>
                </div>
              ) : (
                <button className={buttonPrimary} onClick={handleNext}>
                  Étape suivante
                </button>
              )}
              {loading && (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App

