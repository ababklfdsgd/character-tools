import { type AIProvider, type AIGenerationParams } from '@/types/aiProviders'

// Function to clean up generated text from AI providers
function cleanGeneratedText(text: string): string {
  if (!text) return text
  
  // Remove common prefixes
  const prefixes = [
    '### Response:',
    '###Response:',
    'Response:',
    '### Result:',
    '###Result:',
    'Result:',
    '### Output:',
    '###Output:',
    'Output:'
  ]
  
  for (const prefix of prefixes) {
    if (text.startsWith(prefix)) {
      text = text.substring(prefix.length).trim()
      break
    }
  }
  
  // Remove excessive repetition (simple approach - if text is repeated 3+ times, take just the first instance)
  const lines = text.split('\n')
  if (lines.length > 3) {
    // Check if there's repetition
    const firstLine = lines[0].trim()
    let repetitionCount = 0
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
      if (lines[i].trim() === firstLine) {
        repetitionCount++
      } else {
        break
      }
    }
    
    // If we find significant repetition, just take the first part
    if (repetitionCount >= 2) {
      text = firstLine
    }
  }
  
  return text.trim()
}

interface GenerationResponse {
  text: string
  tokens?: number
}

export async function generateText(
  provider: AIProvider,
  prompt: string,
  params: AIGenerationParams = {}
): Promise<GenerationResponse> {
  if (provider.type === 'api') {
    const response = await fetch(`${provider.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        prompt,
        model: provider.model,
        ...params
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('API provider response data:', data)
    
    // Handle different response formats
    let text = ''
    if (typeof data === 'string') {
      text = data
    } else if (typeof data === 'object') {
      // Try common response formats
      text = data.text || data.generated_text || data.response || data.completion || data.content || JSON.stringify(data)
    } else {
      text = String(data)
    }
    
    // Clean up the text - remove prefixes and extract just the relevant content
    text = cleanGeneratedText(text)
    
    return {
      text,
      tokens: data.tokens
    }
  } else {
    // Local provider (KoboldCPP, LMStudio, etc.)
    const response = await fetch(`${provider.url}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        model: provider.model,
        ...params
      })
    })

    if (!response.ok) {
      throw new Error(`Local API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('KoboldCPP response data:', data)
    
    // Handle different response formats, especially for KoboldCPP
    let text = ''
    if (typeof data === 'string') {
      text = data
    } else if (typeof data === 'object') {
      // Try common response formats for KoboldCPP
      text = data.text || data.generated_text || data.results?.[0]?.text || data.response || data.completion || data.content || JSON.stringify(data)
    } else {
      text = String(data)
    }
    
    // Clean up the text - remove prefixes and extract just the relevant content
    text = cleanGeneratedText(text)
    
    // Extract tokens if available
    const tokens = data.tokens || data.usage?.total_tokens
    
    console.log('Extracted and cleaned text from response:', text)
    
    return {
      text,
      tokens
    }
  }
}

export interface ProviderTestResult {
  ok: boolean
  message?: string
  providerInfo?: {
    name?: string
    baseUrl?: string
    modelOptions?: string[]
  }
}

export async function testProvider(provider: AIProvider): Promise<ProviderTestResult> {
  try {
    if (provider.type === 'api') {
      // Special handling for known API providers
      if (provider.baseUrl.includes('api.novelai.net')) {
        const response = await fetch('https://api.novelai.net/user/subscription', {
          headers: {
            Authorization: `Bearer ${provider.apiKey}`
          }
        })
        
        if (!response.ok) {
          return {
            ok: false,
            message: 'Invalid NovelAI API key'
          }
        }

        // const data = await response.json()
        return {
          ok: true,
          message: 'NovelAI connection successful',
          providerInfo: {
            name: 'NovelAI',
            baseUrl: 'https://api.novelai.net',
            modelOptions: ['kayra-v1', 'clio-v1', 'krake-v2']
          }
        }
      }
      
      // OpenAI provider
      if (provider.baseUrl.includes('api.openai.com')) {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${provider.apiKey}`
          }
        })
        
        if (!response.ok) {
          return {
            ok: false,
            message: 'Invalid OpenAI API key'
          }
        }

        const data = await response.json()
        const modelOptions = data.data
          .filter((model: any) => model.id.startsWith('gpt'))
          .map((model: any) => model.id)
          .sort()
        
        return {
          ok: true,
          message: 'OpenAI connection successful',
          providerInfo: {
            name: 'OpenAI',
            baseUrl: 'https://api.openai.com',
            modelOptions
          }
        }
      }
      
      // Anthropic provider
      if (provider.baseUrl.includes('api.anthropic.com')) {
        // Anthropic doesn't have a public models endpoint, so we'll provide common models
        return {
          ok: true,
          message: 'Anthropic connection successful',
          providerInfo: {
            name: 'Anthropic',
            baseUrl: 'https://api.anthropic.com',
            modelOptions: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
          }
        }
      }
      
      // Generic API provider - try to detect models
      try {
        // Try common model endpoints
        const modelEndpoints = ['/v1/models', '/api/models', '/models']
        for (const endpoint of modelEndpoints) {
          try {
            const response = await fetch(`${provider.baseUrl}${endpoint}`, {
              headers: {
                Authorization: `Bearer ${provider.apiKey}`
              },
              signal: AbortSignal.timeout(5000)
            })
            
            if (response.ok) {
              const data = await response.json()
              let modelOptions: string[] = []
              
              // Handle different response formats
              if (data.data) {
                // OpenAI-like format
                modelOptions = Array.isArray(data.data) 
                  ? data.data.map((item: any) => item.id || item.name).filter(Boolean)
                  : []
              } else if (data.models) {
                // Other format
                modelOptions = Array.isArray(data.models) 
                  ? data.models.map((item: any) => item.id || item.name).filter(Boolean)
                  : []
              }
              
              if (modelOptions.length > 0) {
                return {
                  ok: true,
                  message: 'Connection successful',
                  providerInfo: {
                    name: provider.name || 'API Provider',
                    baseUrl: provider.baseUrl,
                    modelOptions: modelOptions.slice(0, 20) // Limit to 20 models
                  }
                }
              }
            }
          } catch {
            // Continue to next endpoint
            continue
          }
        }
      } catch {
        // If model detection fails, continue with basic connection test
      }
      
      // Generic API connection test
      const response = await fetch(`${provider.baseUrl}/api/health`, {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`
        }
      })

      return {
        ok: response.ok,
        message: response.ok ? 'Connection successful' : 'Connection failed'
      }
    } else {
      // Local provider
      try {
        const response = await fetch(`${provider.url}/api/v1/model`, { signal: AbortSignal.timeout(5000) })
        const data = await response.json()
        
        let providerName = 'Local AI'
        if (provider.url.includes(':5000')) providerName = 'KoboldCPP'
        else if (provider.url.includes(':1234')) providerName = 'LM Studio'
        
        // Try to get available models
        let modelOptions: string[] = []
        try {
          const modelsResponse = await fetch(`${provider.url}/api/v1/models`, { signal: AbortSignal.timeout(5000) })
          if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json()
            modelOptions = modelsData.result?.model_names || modelsData.data?.map((m: any) => m.id) || []
          }
        } catch {
          // If we can't get models, use the current model
          modelOptions = [data.model || 'default']
        }
        
        return {
          ok: true,
          message: `${providerName} connection successful`,
          providerInfo: {
            name: providerName,
            modelOptions
          }
        }
      } catch {
        return {
          ok: false,
          message: 'Could not connect to local AI server'
        }
      }
    }
  } catch (error) {
    console.error('Provider test failed:', error)
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}