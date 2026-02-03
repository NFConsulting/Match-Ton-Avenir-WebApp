import type { ImageResponse } from '../types'

const API_URL = 'https://www.matchtonavenir.info/api/image'

export const generateImage = async (prompt: string): Promise<ImageResponse> => {
  const response = await fetch(API_URL, {
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

  return data
}

export const fetchImageUrls = async (): Promise<string[]> => {
  const response = await fetch('https://www.matchtonavenir.info/api/image/urls')

  if (!response.ok) {
    throw new Error(`Requête échouée (${response.status})`)
  }

  const data = (await response.json()) as { urls?: string[]; items?: string[]; data?: string[] } | string[]
  const urls = Array.isArray(data) ? data : data.urls ?? data.items ?? data.data

  if (!urls || !Array.isArray(urls)) {
    throw new Error('La réponse ne contient pas de liste d’URL.')
  }

  return urls
}
