import type { CachedUrl, CareersResponse, ImageResponse } from '../types'

const BASE_API_URL =
  import.meta.env.VITE_API_URL ??
  'https://matchtonavenir-api-bxd2h0dnd3h9d2de.francecentral-01.azurewebsites.net/api'

const GOOGLE_API_URL = `${BASE_API_URL}/image/google`
const GOOGLE_CAREERS_API_URL = `${BASE_API_URL}/image/google/careers`
const DEFAULT_URLS_PAGE_SIZE = 12
const MAX_FULL_FETCH_PAGES = 500

type StreamCachedUrl = {
  id?: number | string
  url?: string | null
  isDataUrl?: boolean
  urlLength?: number
}

type CursorCachedUrlResponse = {
  afterId?: number
  nextAfterId?: number
  limit?: number
  hasMore?: boolean
  hasNext?: boolean
  urls?: StreamCachedUrl[] | string[]
  items?: StreamCachedUrl[] | string[]
  data?: StreamCachedUrl[] | string[]
  results?: StreamCachedUrl[] | string[]
  value?: StreamCachedUrl[] | string[]
}

type ImageUrlsApiShape =
  | CachedUrl[]
  | string[]
  | CursorCachedUrlResponse

export type FetchImageUrlsPageParams = {
  afterId?: number
  limit?: number
  includeUrl?: boolean
}

export type FetchImageUrlsPageResult = {
  items: CachedUrl[]
  hasMore: boolean
  nextAfterId: number
}

const extractImageId = (url: string): string | undefined => {
  const match = url.match(/\/img-([^/?]+)\.png/i)
  return match?.[1]
}

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const text = (await response.text()).trim()
    if (text) return text
  } catch {
    // ignore parse failures and fallback to status code
  }
  return `Requete echouee (${response.status})`
}

const callCareersApi = async (url: string, prompt: string): Promise<CareersResponse> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as CareersResponse

  return {
    suggestedCareers: Array.isArray(data.suggestedCareers)
      ? data.suggestedCareers.filter((career) => typeof career === 'string')
      : [],
    enrichedPrompt: typeof data.enrichedPrompt === 'string' ? data.enrichedPrompt : prompt,
    isFallback: Boolean(data.isFallback),
  }
}

const callImageApi = async (
  url: string,
  prompt: string,
  suggestedCareers?: string[]
): Promise<ImageResponse> => {
  const payload: { prompt: string; suggestedCareers?: string[] } = { prompt }
  if (Array.isArray(suggestedCareers) && suggestedCareers.length > 0) {
    payload.suggestedCareers = suggestedCareers
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data: ImageResponse = await response.json()
  if (!data.url) {
    throw new Error('La reponse ne contient pas de champ "url".')
  }

  const idFromUrl = extractImageId(data.url)
  const idFromApi = data.id !== undefined && data.id !== null ? String(data.id) : undefined

  return {
    ...data,
    id: idFromApi ?? idFromUrl,
  }
}

const pickArray = (data: ImageUrlsApiShape): unknown[] | undefined => {
  if (Array.isArray(data)) {
    return data
  }
  return data.urls ?? data.items ?? data.data ?? data.results ?? data.value
}

const normalizeUrls = (rawArray: unknown[]): CachedUrl[] =>
  rawArray
    .map((item, index) => {
      if (typeof item === 'string') {
        return { id: String(index), url: item }
      }
      if (typeof item === 'object' && item && 'url' in item) {
        const url = (item as { url?: string | null }).url
        if (!url) return null
        const rawId = (item as { id?: string | number }).id ?? index
        return { id: String(rawId), url }
      }
      return null
    })
    .filter((entry): entry is CachedUrl => Boolean(entry?.url))

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

const extractNextAfterId = (
  data: ImageUrlsApiShape,
  fallbackAfterId: number,
  items: CachedUrl[]
): number => {
  if (!Array.isArray(data)) {
    const candidate = asNumber(data.nextAfterId)
    if (candidate !== null) return candidate
  }

  let maxId = fallbackAfterId
  for (const item of items) {
    const numericId = asNumber(item.id)
    if (numericId !== null && numericId > maxId) {
      maxId = numericId
    }
  }
  return maxId
}

const extractHasMore = (data: ImageUrlsApiShape): boolean | undefined => {
  if (Array.isArray(data)) return undefined
  if (typeof data.hasMore === 'boolean') return data.hasMore
  if (typeof data.hasNext === 'boolean') return data.hasNext
  return undefined
}

export const selectCareersGoogle = async (prompt: string): Promise<CareersResponse> =>
  callCareersApi(GOOGLE_CAREERS_API_URL, prompt)

export const generateImageGoogle = async (
  prompt: string,
  suggestedCareers?: string[]
): Promise<ImageResponse> => callImageApi(GOOGLE_API_URL, prompt, suggestedCareers)

export const fetchImageUrlsPage = async ({
  afterId = 0,
  limit = DEFAULT_URLS_PAGE_SIZE,
  includeUrl = true,
}: FetchImageUrlsPageParams = {}): Promise<FetchImageUrlsPageResult> => {
  const endpoint = new URL(`${BASE_API_URL}/image/urls/stream`)
  endpoint.searchParams.set('afterId', String(Math.max(0, afterId)))
  endpoint.searchParams.set('limit', String(limit))
  endpoint.searchParams.set('includeUrl', includeUrl ? 'true' : 'false')

  const response = await fetch(endpoint.toString())
  const contentLengthHeader = response.headers.get('content-length')

  if (!response.ok) {
    throw new Error(`Requete echouee (${response.status})`)
  }

  const data = (await response.json()) as ImageUrlsApiShape
  const rawArray = pickArray(data)

  if (!rawArray || !Array.isArray(rawArray)) {
    throw new Error('La reponse ne contient pas de liste d URL.')
  }

  const items = normalizeUrls(rawArray)
  const nextAfterId = extractNextAfterId(data, afterId, items)
  const explicitHasMore = extractHasMore(data)
  const hasMore = explicitHasMore ?? (items.length > 0 && items.length >= limit)

  const sizeInfo = contentLengthHeader ? ` (${contentLengthHeader} bytes)` : ''
  console.info(
    `[image/urls/stream] afterId=${afterId} limit=${limit} -> ${items.length} URL(s) recues${sizeInfo} nextAfterId=${nextAfterId} hasMore=${hasMore}`
  )

  return {
    items,
    hasMore,
    nextAfterId,
  }
}

export const fetchImageUrls = async (): Promise<CachedUrl[]> => {
  const allUrls: CachedUrl[] = []
  const unique = new Map<string, CachedUrl>()
  let afterId = 0
  let hasMore = true
  let guard = 0

  while (hasMore && guard < MAX_FULL_FETCH_PAGES) {
    const result = await fetchImageUrlsPage({ afterId, limit: 100, includeUrl: true })

    for (const item of result.items) {
      const key = item.id || item.url
      if (!unique.has(key)) {
        unique.set(key, item)
        allUrls.push(item)
      }
    }

    hasMore = result.hasMore
    if (result.nextAfterId <= afterId) {
      break
    }
    afterId = result.nextAfterId
    guard += 1

    if (result.items.length === 0) {
      break
    }
  }

  if (allUrls.length === 0) {
    throw new Error('La reponse ne contient pas de liste d URL.')
  }

  return allUrls
}

