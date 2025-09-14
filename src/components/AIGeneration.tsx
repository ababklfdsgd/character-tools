import useAppSelector from '@/hooks/useAppSelector'
import { generateText } from '@/services/aiProvider'
import { type AIGenerationParams } from '@/types/aiProviders'
import { AutoFixHigh as AutoFixIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  IconButton,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { type FC, useState } from 'react'

export interface AIGenerationProps {
  onGenerate: (text: string) => void
  context?: string
  defaultPrompt?: string
  label?: string
  helperText?: string
}

const AIGeneration: FC<AIGenerationProps> = ({
  onGenerate,
  context,
  defaultPrompt = '',
  label = 'AI Generation',
  helperText = 'Use AI to help generate content'
}) => {
  const { aiProviders, selectedAiProvider } = useAppSelector((state) => state.app)
  const selectedProvider = aiProviders.find(p => p.name === selectedAiProvider)
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [error, setError] = useState<string>()
  
  const [params, setParams] = useState<AIGenerationParams>({
    temperature: 0.7,
    maxTokens: 200,
    topP: 0.9,
    topK: 40,
    repetitionPenalty: 1.1
  })

  const handleGenerate = async () => {
    if (!selectedProvider) {
      setError('No AI provider selected. Please configure one in settings.')
      return
    }

    setIsGenerating(true)
    setError(undefined)

    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
      const response = await generateText(selectedProvider, fullPrompt, params)
      onGenerate(response.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2">{label}</Typography>
          <Tooltip title={isExpanded ? "Close AI Generation" : "Open AI Generation"}>
            <IconButton
              onClick={() => setIsExpanded(!isExpanded)}
              size="small"
            >
              <AutoFixIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Collapse in={isExpanded}>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Prompt"
              multiline
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              fullWidth
              disabled={isGenerating}
              error={Boolean(error)}
              helperText={error || helperText}
            />

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Generation Parameters</Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2">Temperature: {params.temperature}</Typography>
                <Slider
                  value={params.temperature}
                  onChange={(_, value) => setParams({ ...params, temperature: value as number })}
                  min={0}
                  max={2}
                  step={0.1}
                  disabled={isGenerating}
                />
              </Box>

              <Box>
                <Typography variant="body2">Max Tokens: {params.maxTokens}</Typography>
                <Slider
                  value={params.maxTokens}
                  onChange={(_, value) => setParams({ ...params, maxTokens: value as number })}
                  min={50}
                  max={1000}
                  step={50}
                  disabled={isGenerating}
                />
              </Box>

              <Box>
                <Typography variant="body2">Top P: {params.topP}</Typography>
                <Slider
                  value={params.topP}
                  onChange={(_, value) => setParams({ ...params, topP: value as number })}
                  min={0}
                  max={1}
                  step={0.1}
                  disabled={isGenerating}
                />
              </Box>

              <Box>
                <Typography variant="body2">Top K: {params.topK}</Typography>
                <Slider
                  value={params.topK}
                  onChange={(_, value) => setParams({ ...params, topK: value as number })}
                  min={0}
                  max={100}
                  step={1}
                  disabled={isGenerating}
                />
              </Box>

              <Box>
                <Typography variant="body2">Repetition Penalty: {params.repetitionPenalty}</Typography>
                <Slider
                  value={params.repetitionPenalty}
                  onChange={(_, value) => setParams({ ...params, repetitionPenalty: value as number })}
                  min={1}
                  max={2}
                  step={0.1}
                  disabled={isGenerating}
                />
              </Box>
            </Stack>

            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || !selectedProvider}
              sx={{ mt: 2 }}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoFixIcon />}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default AIGeneration