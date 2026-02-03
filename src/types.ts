export type Option = { label: string; helper?: string }

export type ImageResponse = {
  url: string
  revisedPrompt?: string
  id?: string
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
