export type AIProviderType = 'api' | 'local'

export interface APIProvider {
  type: 'api'
  name: string
  baseUrl: string
  apiKey: string
  model?: string
}

export interface LocalProvider {
  type: 'local'
  name: string
  url: string
  model?: string
}

export type AIProvider = APIProvider | LocalProvider

export interface AIProviderState {
  providers: AIProvider[]
  selectedProvider?: string
}

export interface AIGenerationParams {
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  repetitionPenalty?: number
  stopSequences?: string[]
}