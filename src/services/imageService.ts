import type { CachedUrl, ImageResponse } from '../types'

const BASE_API_URL = import.meta.env.VITE_API_URL ?? 'https://matchtonavenir-api-bxd2h0dnd3h9d2de.francecentral-01.azurewebsites.net/api';


const API_URL = `${BASE_API_URL}/image`
const GOOGLE_API_URL = `${BASE_API_URL}/image/google`

const extractImageId = (url: string): string | undefined => {
  // Typical pattern: .../img-<id>.png?...; capture the <id> part
  const match = url.match(/\/img-([^/?]+)\.png/i)
  return match?.[1]
}

const callImageApi = async (url: string, prompt: string): Promise<ImageResponse> => {
  const response = await fetch(url, {
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

  const idFromUrl = extractImageId(data.url)

  return {
    ...data,
    id: data.id ?? idFromUrl,
  }
}

export const generateImage = async (prompt: string): Promise<ImageResponse> => callImageApi(API_URL, prompt)

export const generateImageGoogle = async (prompt: string): Promise<ImageResponse> =>
  callImageApi(GOOGLE_API_URL, prompt)

export const fetchImageUrls = async (): Promise<CachedUrl[]> => {
  const response = await fetch(`${BASE_API_URL}/image/urls`)

  if (!response.ok) {
    throw new Error(`Requête échouée (${response.status})`)
  }

  const data = (await response.json()) as
    | CachedUrl[]
    | string[]
    | { urls?: string[]; items?: string[]; data?: string[] }
    | { urls?: CachedUrl[]; items?: CachedUrl[]; data?: CachedUrl[] }

  // Backward compatibility: handle arrays of strings as well as arrays of objects with id/url.
  const rawArray = Array.isArray(data) ? data : data.urls ?? data.items ?? data.data

  if (!rawArray || !Array.isArray(rawArray)) {
    throw new Error('La réponse ne contient pas de liste d’URL.')
  }

  const normalized: CachedUrl[] = rawArray
    .map((item, index) => {
      if (typeof item === 'string') {
        return { id: String(index), url: item }
      }
      if (typeof item === 'object' && item && 'url' in item) {
        const url = (item as CachedUrl).url
        const rawId = (item as CachedUrl).id ?? index
        return { id: String(rawId), url }
      }
      return null
    })
    .filter((entry): entry is CachedUrl => Boolean(entry?.url))

  if (normalized.length === 0) {
    throw new Error('La réponse ne contient pas de liste d’URL.')
  }

  return normalized
}
