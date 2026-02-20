import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import AvatarSection from './components/AvatarSection'
import CheckboxList from './components/CheckboxList'
import Emoji from './components/Emoji'
import JobsSection from './components/JobsSection'
import {
  cognitive,
  developOptions,
  emotional,
  interests,
  social,
} from './constants/options'
import {
  fetchImageUrlsPage,
  generateImageGoogle,
  selectCareersGoogle,
} from './services/imageService'
import { buildCareersPayload, buildPrompt } from './utils/prompt'
import type { CachedUrl, CareersRequest, PromptInput } from './types'

const MIN_STRENGTHS = 3
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

const GuidanceNotice = () => (
  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5 text-slate-800">
    <p className="text-lg font-semibold text-slate-900">À savoir</p>
    <p className="mt-3 text-sm leading-relaxed">
      Cet outil utilise l&apos;IA pour t&apos;aider à imaginer ton futur et créer ton avatar.
      Attention : l&apos;IA n&apos;est pas toujours exacte et les métiers ou suggestions qu&apos;elle
      propose peuvent être inappropriés, incomplets ou peu adaptés à ta situation. Utilise-les
      uniquement comme source d&apos;inspiration, et vérifie toujours avec des adultes ou des
      sources fiables.
    </p>
    <p className="mt-4 text-sm font-semibold text-slate-900">Comme prochaines étapes :</p>
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
      <li>
        <a
          href="https://www.onisep.fr/recherche?context=metier"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-600 underline decoration-brand-600/50 underline-offset-2"
        >
          Consulte ONISEP - Découvrir les métiers
        </a>
      </li>
      <li>Parle à tes proches, à ton professeur principal ou à ton conseiller d&apos;orientation</li>
      <li>Participe à des salons ou journées portes ouvertes pour découvrir les métiers</li>
    </ul>
  </div>
)

const DataPreventionFooter = ({ onOpenMentions }: { onOpenMentions: () => void }) => (
  <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-xs leading-relaxed text-slate-600">
    <p>
      Dans le cadre de l’évènement Match ton Avenir, le Conseil Départemental des Yvelines
      utilise les informations que tu renseignes pour créer ton avatar et t’aider à visualiser ton
      projet d’études ou professionnel.
    </p>
    <p className="mt-2">
      Ces données sont utilisées avec ton consentement, uniquement pour cet objectif, conservées
      le temps nécessaire puis supprimées.
    </p>
    <p className="mt-2">
      Elles ne sont pas transférées hors de l’Union Européenne et tu peux exercer tes droits à
      tout moment (accès, correction, suppression, etc.).
    </p>
    <p className="mt-2">
      Pour en savoir plus sur l’utilisation de tes données et tes droits,{' '}
      <button
        type="button"
        className="font-semibold text-brand-600 underline decoration-brand-600/50 underline-offset-2"
        onClick={onOpenMentions}
      >
        clique ici
      </button>
      .
    </p>
    <p className="mt-2">
      En cas de question ou si tu estimes que tes droits ne sont pas respectés, tu peux aussi
      contacter la CNIL (autorité française de protection des données).
    </p>
  </div>
)

const MentionsModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
          aria-label="Fermer"
          onClick={onClose}
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <p className="text-xl font-bold text-slate-900">Evènement : Match ton Avenir</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">Qui utilise tes données ?</p>
        <p className="mt-2 text-sm text-slate-700">
          Le Conseil Départemental des Yvelines (représenté par son Président, situé au 2, Place
          André Mignot).
        </p>

        <p className="mt-5 text-lg font-semibold text-slate-900">Pourquoi on utilise tes données ?</p>
        <p className="mt-2 text-sm text-slate-700">Pour créer ton avatar et t’aider à :</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Mieux imaginer ton futur métier</li>
          <li>Réfléchir à ton projet d’études</li>
          <li>Evaluer l’évènement</li>
        </ul>

        <p className="mt-5 text-lg font-semibold text-slate-900">Quelles données ?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Ton identité (ex : nom, prénom)</li>
          <li>Des informations liées à ta vie personnelle et ton projet</li>
        </ul>
        <p className="mt-2 text-sm text-slate-700">
          Ces informations sont celles que tu as données toi-même dans le prompt.
        </p>

        <p className="mt-5 text-lg font-semibold text-slate-900">
          Pourquoi on a le droit de les utiliser ?
        </p>
        <p className="mt-2 text-sm text-slate-700">
          Parce que tu as donné ton consentement (article 6(1)a du RGPD) et parce que cela nous
          aide à mesurer l’efficacité et à améliorer les évènements que nous te proposeront par la
          suite (article 6(1)f).
        </p>

        <p className="mt-5 text-lg font-semibold text-slate-900">Combien de temps on les garde ?</p>
        <p className="mt-2 text-sm text-slate-700">
          Uniquement le temps nécessaire pour t’accompagner, puis elles sont supprimées.
        </p>

        <p className="mt-5 text-lg font-semibold text-slate-900">Qui peut les voir ?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Les services concernés</li>
          <li>Certains partenaires commerciaux ou institutionnels</li>
        </ul>
        <p className="mt-2 text-sm text-slate-700">
          Aucune décision n’est prise automatiquement par un ordinateur seul.
          <br />
          Tes données ne sont pas envoyées hors de l’Union Européenne.
        </p>

        <p className="mt-5 text-lg font-semibold text-slate-900">Tes droits</p>
        <p className="mt-2 text-sm text-slate-700">
          Tu peux : voir tes données, les corriger, demander leur suppression, t’opposer à leur
          utilisation, demander une copie.
        </p>

        <p className="mt-5 text-sm text-slate-700">Pour toute question ou pour exercer tes droits :</p>
        <p className="mt-1 text-sm text-slate-700">Contact DPO : dpo@yvelines.fr</p>
        <p className="mt-1 text-sm text-slate-700">
          Courrier : DPO, 2 Place André Mignot 78000 VERSAILLES
        </p>

        <p className="mt-4 text-sm text-slate-700">
          Si tu penses que tes droits ne sont pas respectés, tu peux contacter la CNIL (autorité
          française qui protège les données personnelles).
        </p>
        <p className="mt-2 text-sm text-slate-700">
          Plus d’infos sur :{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-600 underline decoration-brand-600/50 underline-offset-2"
          >
            cnil.fr
          </a>
        </p>
      </div>
    </div>
  )
}

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
const eyebrowClass = 'text-sm font-bold uppercase tracking-[0.14em] text-brand-500 sm:text-base'
const chipClass =
  'inline-flex w-fit items-center rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white'
const countChipClass =
  'inline-flex items-center rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-900'
const careersPillClass =
  'inline-flex min-h-[3rem] items-center rounded-2xl border border-brand-500/25 bg-white px-4 py-2 text-base font-semibold text-slate-900 shadow-[0_8px_18px_rgba(0,0,0,0.08)] sm:text-lg'

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

const GALLERY_PAGE_SIZE = 12
const AVATAR_LOADING_MESSAGES = [
  "On peaufine ton avatar, il veut être incroyable.",
  "Ton futur toi ajuste sa meilleure pose.",
  "Calibration du style en cours... swag détecté.",
  "On mélange tes talents avec une pointe de magie.",
  "Ton avatar choisit sa tenue de champion.",
  "Les idées brillantes arrivent en file indienne.",
  "Ton double numérique prend confiance.",
  "On ajoute 2 grammes de charisme et 1 sourire.",
  "Le mode créatif chauffe tranquillement.",
  "Ton avatar fait des pompes imaginaires.",
  "Assemblage des compétences... presque prêt.",
  "Le cerveau de l'avatar fait des étincelles.",
  "On aligne style, posture et énergie.",
  "Ton futur toi répète son entrée classe.",
  "Les détails cool sont en train de pop.",
  "Patience, ton avatar se met en mode légendaire.",
  "Vérification finale : look validé, attitude validée.",
  "Ton avatar prend son élan pour apparaître.",
  "On finit la touche wow juste pour toi.",
  "Encore un instant : ton avatar arrive en scène.",
]

const pickRandomIndex = (max: number, exclude: number = -1) => {
  if (max <= 1) {
    return 0
  }
  let next = Math.floor(Math.random() * max)
  while (next === exclude) {
    next = Math.floor(Math.random() * max)
  }
  return next
}

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
  const [imageUrl, setImageUrl] = useState('')
  const [imageId, setImageId] = useState<string | undefined>()
  const [suggestedCareers, setSuggestedCareers] = useState<string[]>([])
  const [careersIsFallback, setCareersIsFallback] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(() =>
    pickRandomIndex(AVATAR_LOADING_MESSAGES.length)
  )

  const [view, setView] = useState<'form' | 'portfolio'>('form')
  const [step, setStep] = useState(0)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<CachedUrl[]>([])
  const [portfolioReloadKey, setPortfolioReloadKey] = useState(0)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [singleImageUrl, setSingleImageUrl] = useState<string | null>(null)
  const [singleImageError, setSingleImageError] = useState<string | null>(null)
  const [showMentionsModal, setShowMentionsModal] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [portfolioAfterId, setPortfolioAfterId] = useState(0)
  const [portfolioHasMore, setPortfolioHasMore] = useState(true)
  const [portfolioLoadingMore, setPortfolioLoadingMore] = useState(false)
  const [snapshotDownloading, setSnapshotDownloading] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const snapshotSectionRef = useRef<HTMLDivElement | null>(null)

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

  const strengthSelectionCount = counts.cognitive + counts.emotional + counts.social
  const hasStrengthAnswers =
    strengthSelectionCount >= MIN_STRENGTHS && strengthSelectionCount <= MAX_STRENGTHS
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
  const careersToDisplay = suggestedCareers
  const selectedStrengthsFromStart = strengthLabels.filter((label) => strengthsSelected[label])

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
    strengths:
      'Choisis entre 3 et 5 compétences parmi les compétences cognitives, émotionnelles et sociales.',
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
    async (
      targetUrl: string | null | undefined,
      candidateId?: string | number | null,
      sectionToCapture?: HTMLElement | null
    ) => {
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

      const blobToDataUrl = async (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result)
              return
            }
            reject(new Error('data_url_failed'))
          }
          reader.onerror = () => reject(new Error('data_url_failed'))
          reader.readAsDataURL(blob)
        })

      const copyComputedStyles = (source: Element, target: Element) => {
        const sourceStyle = window.getComputedStyle(source as HTMLElement)
        const targetStyle = (target as HTMLElement).style
        for (const property of Array.from(sourceStyle)) {
          targetStyle.setProperty(
            property,
            sourceStyle.getPropertyValue(property),
            sourceStyle.getPropertyPriority(property)
          )
        }

        const sourceChildren = Array.from(source.children)
        const targetChildren = Array.from(target.children)
        for (let i = 0; i < sourceChildren.length; i += 1) {
          if (targetChildren[i]) {
            copyComputedStyles(sourceChildren[i], targetChildren[i])
          }
        }
      }

      const tryDownloadSectionSnapshot = async () => {
        if (!sectionToCapture) return false

        const width = Math.max(1, Math.ceil(sectionToCapture.scrollWidth))
        const height = Math.max(1, Math.ceil(sectionToCapture.scrollHeight))
        const clone = sectionToCapture.cloneNode(true) as HTMLElement

        copyComputedStyles(sectionToCapture, clone)
        clone.style.margin = '0'
        clone.style.width = `${width}px`
        clone.style.height = `${height}px`
        clone.style.boxSizing = 'border-box'
        clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')

        const sourceImages = Array.from(sectionToCapture.querySelectorAll('img'))
        const clonedImages = Array.from(clone.querySelectorAll('img'))

        for (let i = 0; i < sourceImages.length; i += 1) {
          const sourceImage = sourceImages[i]
          const cloneImage = clonedImages[i]
          if (!cloneImage) continue

          const imageSrc = sourceImage.currentSrc || sourceImage.getAttribute('src') || ''
          if (!imageSrc) continue

          try {
            const imageResponse = await fetch(imageSrc)
            if (!imageResponse.ok) continue
            const imageBlob = await imageResponse.blob()
            const dataUrl = await blobToDataUrl(imageBlob)
            cloneImage.setAttribute('src', dataUrl)
          } catch {
            // keep original src if conversion fails
          }
        }

        const serializedNode = new XMLSerializer().serializeToString(clone)
        const svgString =
          `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
          `<foreignObject width="100%" height="100%">${serializedNode}</foreignObject>` +
          '</svg>'
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)

        try {
          const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.decoding = 'async'
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error('snapshot_load_failed'))
            img.src = svgUrl
          })

          const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(width * scale)
          canvas.height = Math.round(height * scale)
          const context = canvas.getContext('2d')
          if (!context) {
            throw new Error('canvas_context_unavailable')
          }
          context.scale(scale, scale)
          context.fillStyle = '#ffffff'
          context.fillRect(0, 0, width, height)
          context.drawImage(image, 0, 0, width, height)

          const pngBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob)
                return
              }
              reject(new Error('snapshot_blob_failed'))
            }, 'image/png')
          })
          const blobUrl = URL.createObjectURL(pngBlob)
          clickDownloadLink(blobUrl)
          window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500)
          return true
        } finally {
          URL.revokeObjectURL(svgUrl)
        }
      }

      const tryDownloadComposedSnapshot = async () => {
        const loadImageElement = async (imageUrl: string): Promise<HTMLImageElement> => {
          const response = await fetch(imageUrl)
          if (!response.ok) {
            throw new Error('image_fetch_failed')
          }

          const imageBlob = await response.blob()
          const imageBlobUrl = URL.createObjectURL(imageBlob)

          try {
            return await new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image()
              image.decoding = 'async'
              image.onload = () => resolve(image)
              image.onerror = () => reject(new Error('image_load_failed'))
              image.src = imageBlobUrl
            })
          } finally {
            URL.revokeObjectURL(imageBlobUrl)
          }
        }

        const wrapText = (
          context: CanvasRenderingContext2D,
          text: string,
          maxWidth: number
        ): string[] => {
          const words = text.trim().split(/\s+/).filter(Boolean)
          if (words.length === 0) return []

          const lines: string[] = []
          let current = words[0]
          for (let i = 1; i < words.length; i += 1) {
            const candidate = `${current} ${words[i]}`
            if (context.measureText(candidate).width <= maxWidth) {
              current = candidate
            } else {
              lines.push(current)
              current = words[i]
            }
          }
          lines.push(current)
          return lines
        }

        const drawPanel = (
          context: CanvasRenderingContext2D,
          x: number,
          y: number,
          width: number,
          height: number,
          title: string,
          lines: string[]
        ) => {
          const padding = 20
          const titleHeight = 30
          const lineHeight = 24

          context.fillStyle = '#ffffff'
          context.fillRect(x, y, width, height)
          context.strokeStyle = '#e2e8f0'
          context.lineWidth = 2
          context.strokeRect(x, y, width, height)

          context.fillStyle = '#0f172a'
          context.font = '700 24px "Segoe UI", sans-serif'
          context.fillText(title, x + padding, y + padding + 20)

          context.fillStyle = '#334155'
          context.font = '500 20px "Segoe UI", sans-serif'
          let cursorY = y + padding + titleHeight + 6
          for (const line of lines) {
            context.fillText(line, x + padding, cursorY)
            cursorY += lineHeight
          }
        }

        try {
          const image = await loadImageElement(url)
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) {
            return false
          }

          const pageWidth = 1400
          const pagePadding = 44
          const blockGap = 26
          const contentWidth = pageWidth - pagePadding * 2

          const imageScale = Math.min(contentWidth / image.naturalWidth, 680 / image.naturalHeight)
          const imageWidth = Math.max(1, Math.round(image.naturalWidth * imageScale))
          const imageHeight = Math.max(1, Math.round(image.naturalHeight * imageScale))

          context.font = '500 20px "Segoe UI", sans-serif'
          const panelInnerWidth = (contentWidth - blockGap) / 2 - 40
          const skillItems =
            selectedStrengthsFromStart.length > 0
              ? selectedStrengthsFromStart.map((item) => `• ${item}`)
              : ['• Aucune compétence sélectionnée.']
          const careerItems =
            careersToDisplay.length > 0
              ? careersToDisplay.map((item, index) => `${index + 1}. ${item}`)
              : ['Aucun métier retourné pour le moment.']

          const skillLines = skillItems.flatMap((item) => wrapText(context, item, panelInnerWidth))
          const careerLines = careerItems.flatMap((item) => wrapText(context, item, panelInnerWidth))
          const panelLineHeight = 24
          const panelFixedHeight = 20 + 30 + 6 + 14
          const skillsPanelHeight = Math.max(220, panelFixedHeight + skillLines.length * panelLineHeight)
          const careersPanelHeight = Math.max(220, panelFixedHeight + careerLines.length * panelLineHeight)
          const panelHeight = Math.max(skillsPanelHeight, careersPanelHeight)

          context.font = '500 19px "Segoe UI", sans-serif'
          const guidanceTextLines = [
            "Cet outil utilise l'IA pour t'aider a imaginer ton futur et creer ton avatar.",
            "Attention : l'IA n'est pas toujours exacte et les metiers ou suggestions qu'elle propose peuvent etre inappropries, incomplets ou peu adaptes a ta situation.",
            "Utilise-les uniquement comme source d'inspiration, et verifie toujours avec des adultes ou des sources fiables.",
            'Comme prochaines etapes :',
            '• Consulte ONISEP - Decouvrir les metiers',
            "• Parle a tes proches, a ton professeur principal ou a ton conseiller d'orientation",
            '• Participe a des salons ou journees portes ouvertes pour decouvrir les metiers',
          ].flatMap((line) => wrapText(context, line, contentWidth - 40))
          const guidanceHeight = Math.max(230, 24 + 30 + 12 + guidanceTextLines.length * 23 + 24)

          const totalHeight =
            pagePadding +
            52 +
            blockGap +
            imageHeight +
            blockGap +
            panelHeight +
            blockGap +
            guidanceHeight +
            pagePadding

          canvas.width = pageWidth
          canvas.height = Math.ceil(totalHeight)

          context.fillStyle = '#ffffff'
          context.fillRect(0, 0, canvas.width, canvas.height)

          context.fillStyle = '#0f172a'
          context.font = '700 36px "Segoe UI", sans-serif'
          context.fillText('Apercu de ton avatar', pagePadding, pagePadding + 34)

          const imageX = pagePadding + Math.round((contentWidth - imageWidth) / 2)
          const imageY = pagePadding + 52 + blockGap
          context.fillStyle = '#ffffff'
          context.fillRect(pagePadding, imageY, contentWidth, imageHeight)
          context.strokeStyle = '#e2e8f0'
          context.lineWidth = 2
          context.strokeRect(pagePadding, imageY, contentWidth, imageHeight)
          context.drawImage(image, imageX, imageY, imageWidth, imageHeight)

          const panelY = imageY + imageHeight + blockGap
          const leftPanelX = pagePadding
          const rightPanelX = pagePadding + (contentWidth - blockGap) / 2 + blockGap
          const panelWidth = (contentWidth - blockGap) / 2
          drawPanel(
            context,
            leftPanelX,
            panelY,
            panelWidth,
            panelHeight,
            'Competences selectionnees',
            skillLines
          )
          drawPanel(
            context,
            rightPanelX,
            panelY,
            panelWidth,
            panelHeight,
            'Metiers retournes par l IA',
            careerLines
          )

          const guidanceY = panelY + panelHeight + blockGap
          context.fillStyle = '#fffbeb'
          context.fillRect(pagePadding, guidanceY, contentWidth, guidanceHeight)
          context.strokeStyle = '#fde68a'
          context.lineWidth = 2
          context.strokeRect(pagePadding, guidanceY, contentWidth, guidanceHeight)

          context.fillStyle = '#0f172a'
          context.font = '700 28px "Segoe UI", sans-serif'
          context.fillText('A savoir', pagePadding + 20, guidanceY + 38)

          context.fillStyle = '#334155'
          context.font = '500 19px "Segoe UI", sans-serif'
          let guidanceCursorY = guidanceY + 70
          for (const line of guidanceTextLines) {
            context.fillText(line, pagePadding + 20, guidanceCursorY)
            guidanceCursorY += 23
          }

          const pngBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob)
                return
              }
              reject(new Error('composed_blob_failed'))
            }, 'image/png')
          })
          const blobUrl = URL.createObjectURL(pngBlob)
          clickDownloadLink(blobUrl)
          window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500)
          return true
        } catch {
          return false
        }
      }

      setSnapshotDownloading(true)
      try {
        const snapshotDownloaded = await tryDownloadSectionSnapshot()
        if (snapshotDownloaded) {
          return
        }

        const composedDownloaded = await tryDownloadComposedSnapshot()
        if (composedDownloaded) {
          return
        }

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
      } finally {
        setSnapshotDownloading(false)
      }
    },
    [careersToDisplay, selectedStrengthsFromStart]
  )

  const submitPrompt = async (
    prompt: string,
    careersPayload: CareersRequest,
    careersSelector: (payload: CareersRequest) => Promise<string[]> = selectCareersGoogle,
    generator: (
      p: string,
      suggestedCareers?: string[]
    ) => Promise<{
      url: string
      revisedPrompt?: string | null
      id?: string
      suggestedCareers?: string[] | null
    }> = generateImageGoogle
  ) => {
    setImageUrl('')
    setImageId(undefined)
    setSuggestedCareers([])
    setCareersIsFallback(null)

    const cleanedPrompt = prompt.trim()
    if (!cleanedPrompt) {
      console.error('[generate] Prompt vide: génération annulée.')
      return
    }

    setLoading(true)
    try {
      const careersData = await careersSelector(careersPayload)
      const careers = Array.isArray(careersData)
        ? careersData.filter((career) => typeof career === 'string')
        : []

      setSuggestedCareers(careers)
      setCareersIsFallback(null)

      const data = await generator(cleanedPrompt, careers)

      const finalCareers = Array.isArray(data.suggestedCareers)
        ? data.suggestedCareers.filter((career) => typeof career === 'string')
        : careers
      setSuggestedCareers(finalCareers)

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
      console.error('[generate] Echec génération:', message, fetchError)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    const promptInput = buildPromptInput()
    const prompt = buildPrompt(promptInput)
    const careersPayload = buildCareersPayload(promptInput)
    await submitPrompt(prompt, careersPayload)
  }

  const loadPortfolioPage = useCallback(
    async (targetAfterId: number, replace = false) => {
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
        console.error('[portfolio] Echec chargement images:', message, fetchError)
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
        label: (
          <>
            <Emoji symbol="🏅" /> Ce que j’ai montré pendant le sport
          </>
        ),
        content: (
          <div className={sectionBlockClass}>
            <p className={eyebrowClass}>
              1. <Emoji symbol="🏅" /> CE QUE J’AI MONTRÉ PENDANT LE SPORT
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Choisis 3 à 5 compétences parmi les compétences cognitives, émotionnelles et sociales
            </p>
            <div className="mt-5 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  <Emoji symbol="🧠" /> Compétences cognitives — Esprit clair
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
                <h3 className="text-lg font-semibold text-slate-900">
                  <Emoji symbol="❤️" /> Compétences émotionnelles — Cœur calme
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
                <h3 className="text-lg font-semibold text-slate-900">
                  <Emoji symbol="🤝" /> Compétences sociales — Bras ouverts
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
        label: (
          <>
            <Emoji symbol="📈" /> Compétences à développer
          </>
        ),
        content: (
          <div className={sectionBlockClass}>
            <p className={eyebrowClass}>
              <Emoji symbol="📈" /> Tes compétences sont évolutives, qu’aimerais tu développer
              davantage ?
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Choisis 1 à 3 compétences que tu souhaites améliorer
            </p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
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
        label: (
          <>
            <Emoji symbol="💡" /> Centres d’intérêt
          </>
        ),
        content: (
          <div className={sectionBlockClass}>
            <p className={eyebrowClass}>
              2. <Emoji symbol="💡" /> MES CENTRES D’INTÉRÊT
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Choisis 1 à 3 centres d’intérêt que tu préfères
            </p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
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
        label: (
          <>
            <Emoji symbol="🧭" /> Métiers explorés
          </>
        ),
        content: (
          <div className={sectionBlockClass}>
            <p className={eyebrowClass}>
              3. <Emoji symbol="🧭" /> MÉTIERS SUR LESQUELS JE ME PROJETTE :
            </p>
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
        label: (
          <>
            <Emoji symbol="🧑‍🚀" /> Détails de l’avatar
          </>
        ),
        content: (
          <div className={sectionBlockClass}>
            <p className={eyebrowClass}>
              4. <Emoji symbol="🧑‍🚀" /> À QUOI RESSEMBLE MON AVATAR
            </p>
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
      careersIsFallback,
      careersToDisplay,
      exploring,
      handleDownloadImage,
      hair,
      imageId,
      imageUrl,
      jobs,
      loading,
      selectedStrengthsFromStart,
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
    setImageUrl('')
    setImageId(undefined)
    setSuggestedCareers([])
    setCareersIsFallback(null)
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
    setShowMentionsModal(false)
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

  useEffect(() => {
    if (!loading) {
      return
    }

    setLoadingMessageIndex((prev) => pickRandomIndex(AVATAR_LOADING_MESSAGES.length, prev))
    const intervalId = window.setInterval(() => {
      setLoadingMessageIndex((prev) => pickRandomIndex(AVATAR_LOADING_MESSAGES.length, prev))
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [loading])

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

        const notFoundMessage = 'Image introuvable avec cet identifiant.'
        setSingleImageError(notFoundMessage)
        console.error('[single-image]', notFoundMessage, route.imageId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Impossible de récupérer l’image.'
        setSingleImageError(msg)
        console.error('[single-image] Echec récupération image:', msg, err)
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
            <Emoji symbol="📸" /> Aperçu de l’image
          </h1>
        </section>

        <section className={panelClass}>
          {!singleImageUrl && !singleImageError && spinner}
          {singleImageError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {singleImageError}
            </p>
          )}
          {singleImageUrl && (
            <div className="space-y-4" ref={snapshotSectionRef}>
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                  <img src={singleImageUrl} alt="Avatar généré" className="h-full w-full object-cover" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className={sectionBlockClass}>
                    <p className="text-lg font-semibold text-slate-900">
                      <Emoji symbol="🏅" /> Compétences sélectionnées
                    </p>
                    {selectedStrengthsFromStart.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedStrengthsFromStart.map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1 text-sm font-semibold text-slate-900"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Aucune compétence sélectionnée.</p>
                    )}
                  </div>
                  <div className={sectionBlockClass}>
                    <p className="text-lg font-semibold text-slate-900">
                      <Emoji symbol="🧭" /> Métiers retournés par l’intelligence artificielle
                    </p>
                    {careersToDisplay.length > 0 ? (
                      <div className="mt-3 grid gap-2">
                        {careersToDisplay.map((career, index) => (
                          <span
                            key={`${career}-${index}`}
                            className={careersPillClass}
                          >
                            <span className="mr-2 text-brand-600">{index + 1}.</span>
                            {career}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Aucun métier retourné pour le moment.</p>
                    )}
                    {careersIsFallback !== null && (
                      <p className="mt-3 text-xs font-medium text-slate-600">
                        {careersIsFallback ? 'Sélection métiers : mode fallback' : 'Sélection métiers : IA'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <GuidanceNotice />
            </div>
          )}
        </section>

        <section className="space-y-4 pb-2">
          <DataPreventionFooter onOpenMentions={() => setShowMentionsModal(true)} />
          {singleImageUrl && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className={`${buttonOutline} w-full px-5 py-3 text-base`}
                onClick={goToGenerator}
              >
                Revenir au générateur
              </button>
              <button
                type="button"
                className={`${buttonPrimary} w-full px-5 py-3 text-base`}
                onClick={() =>
                  void handleDownloadImage(singleImageUrl, route.imageId, snapshotSectionRef.current)
                }
                disabled={snapshotDownloading}
              >
                {snapshotDownloading ? 'Téléchargement...' : "Télécharger l'image"}
              </button>
            </div>
          )}
        </section>

        <MentionsModal open={showMentionsModal} onClose={() => setShowMentionsModal(false)} />
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
            <Emoji symbol="🗂️" /> Galerie des images générées
          </h1>
          <p className="text-sm text-slate-600">
            <Emoji symbol="✨" /> Liste de toutes les images générées
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              className={buttonOutline}
              onClick={() => {
                goToGenerator()
              }}
            >
              <Emoji symbol="↩️" /> Retour au générateur
            </button>
            <button
              className={buttonPrimary}
              onClick={() => setPortfolioReloadKey((prev) => prev + 1)}
              disabled={portfolioLoading}
            >
              <Emoji symbol="🔄" /> Rafraîchir la liste
            </button>
          </div>
        </section>

        <section className={panelClass}>
          {portfolioLoading ? (
            spinner
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                {imageUrls.length === 0 && (
                  <p className="text-sm text-slate-500">
                    <Emoji symbol="😶" /> Il n&apos;y a pas encore d&apos;image pour le moment :(
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
          JE CRÉE MON AVATAR – MATCH TON AVENIR <Emoji symbol="🚀" />
        </h1>
        <p className="text-lg font-semibold text-slate-900">
          Et si tu pouvais rencontrer ton futur toi ? <Emoji symbol="✨" />
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
              <Emoji symbol="🧩" /> Étape {step + 1} / {totalSteps}
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
              {isLastStep ? (
                <button
                  className={buttonPrimaryLarge}
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <Emoji symbol="✨" /> Générer mon avatar
                </button>
              ) : (
                <button className={buttonPrimary} onClick={handleNext}>
                  Étape suivante
                </button>
              )}
              {loading && (
                <div className="flex w-full max-w-[620px] shrink-0 items-center gap-3 rounded-xl border border-brand-500/20 bg-brand-500/5 px-3 py-2 sm:w-[620px]">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
                  <div className="w-full min-w-0">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
                    </div>
                    <p className="mt-1 truncate whitespace-nowrap text-sm font-medium text-slate-700">
                      {AVATAR_LOADING_MESSAGES[loadingMessageIndex]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App

