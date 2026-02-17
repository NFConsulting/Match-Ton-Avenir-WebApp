export type Option = { label: string; helper?: string }

export type ImageResponse = {
  url: string
  revisedPrompt?: string | null
  id?: string
  suggestedCareers?: string[] | null
}

export type CareersResponse = {
  suggestedCareers: string[]
  enrichedPrompt: string
  isFallback: boolean
}

export type CachedUrl = {
  id: string
  url: string
}

export type PromptInput = {
  strengthsSelected: Record<string, boolean>
  developSelected: Record<string, boolean>
  chosenPostures: Record<string, boolean>
  chosenStyles: Record<string, boolean>
  avatarGender: string
  avatarExpression: string
  hair: string
  avatarTeint: string
  avatarWords: string[]
  jobs: string[]
  exploring: boolean
}
