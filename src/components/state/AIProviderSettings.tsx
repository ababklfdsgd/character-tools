import useAppDispatch from '@/hooks/useAppDispatch'
import useAppSelector from '@/hooks/useAppSelector'
import { addAiProvider, removeAiProvider, setSelectedAiProvider } from '@/state/appSlice'
import { type AIProvider } from '@/types/aiProviders'
import { Add as AddIcon, Delete as DeleteIcon, CheckCircle as CheckIcon, Error as ErrorIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { type FC, useState } from 'react'
import { testProvider, type ProviderTestResult } from '@/services/aiProvider'

const AIProviderSettings: FC = () => {
  const { aiProviders, selectedAiProvider } = useAppSelector((state) => state.app)
  const dispatch = useAppDispatch()
  const [isAdding, setIsAdding] = useState(false)
  const [newProvider, setNewProvider] = useState<Partial<AIProvider>>({
    type: 'api'
  })
  const [testResponse, setTestResponse] = useState<ProviderTestResult & { testing?: boolean }>({ok: false})

  const handleSaveNewProvider = async () => {
    if (
      !newProvider.name ||
      !newProvider.type ||
      (newProvider.type === 'api' && (!newProvider.baseUrl || !newProvider.apiKey)) ||
      (newProvider.type === 'local' && !newProvider.url)
    ) {
      return
    }

    // Test connection one last time before saving
    const result = await testProvider(newProvider as AIProvider)
    if (!result.ok) {
      if (!confirm('Connection test failed. Save anyway?')) {
        return
      }
    }

    dispatch(addAiProvider(newProvider as AIProvider))
    setIsAdding(false)
    setNewProvider({ type: 'api' })
    setTestResponse({ ok: false })
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2">AI Providers</Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel>Selected Provider</InputLabel>
        <Select
          value={selectedAiProvider ?? ''}
          label="Selected Provider"
          onChange={(e) => dispatch(setSelectedAiProvider(e.target.value || undefined))}
        >
          <MenuItem value="">None</MenuItem>
          {aiProviders.map((provider) => (
            <MenuItem key={provider.name} value={provider.name}>
              {provider.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {aiProviders.map((provider) => (
        <Box key={provider.name} sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">{provider.name}</Typography>
            <IconButton onClick={() => dispatch(removeAiProvider(provider.name))}>
              <DeleteIcon />
            </IconButton>
          </Stack>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">Type: {provider.type}</Typography>
            {provider.type === 'api' && (
              <>
                <Typography variant="body2">Base URL: {provider.baseUrl}</Typography>
                <Typography variant="body2">API Key: {'*'.repeat(8)}</Typography>
              </>
            )}
            {provider.type === 'local' && (
              <Typography variant="body2">URL: {provider.url}</Typography>
            )}
            {provider.model && (
              <Typography variant="body2">Model: {provider.model}</Typography>
            )}
          </Stack>
        </Box>
      ))}

      {!isAdding && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => setIsAdding(true)}
          sx={{ mt: 2 }}
        >
          Add Provider
        </Button>
      )}

      {isAdding && (
        <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle1">New Provider</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {newProvider.type === 'api' ? (
              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={newProvider.name ?? ''}
                  label="Provider"
                  onChange={(e) => {
                    const providerName = e.target.value as string;
                    let baseUrl = newProvider.baseUrl || '';
                    
                    // Set default URLs for known providers
                    if (providerName === 'NovelAI') {
                      baseUrl = 'https://api.novelai.net';
                    } else if (providerName === 'OpenAI') {
                      baseUrl = 'https://api.openai.com/v1';
                    } else if (providerName === 'Anthropic') {
                      baseUrl = 'https://api.anthropic.com';
                    }
                    
                    setNewProvider({ 
                      ...newProvider, 
                      name: providerName,
                      baseUrl
                    });
                  }}
                >
                  <MenuItem value="">Custom</MenuItem>
                  <MenuItem value="NovelAI">NovelAI</MenuItem>
                  <MenuItem value="OpenAI">OpenAI</MenuItem>
                  <MenuItem value="Anthropic">Anthropic</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <TextField
                label="Name"
                value={newProvider.name ?? ''}
                onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                fullWidth
              />
            )}

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newProvider.type}
                label="Type"
                onChange={(e) => setNewProvider({ 
                  ...newProvider,
                  type: e.target.value as AIProvider['type'],
                  // Clear type-specific fields when switching types
                  baseUrl: undefined,
                  apiKey: undefined,
                  url: undefined
                })}
              >
                <MenuItem value="api">API (NovelAI, etc.)</MenuItem>
                <MenuItem value="local">Local (KoboldCPP, LMStudio)</MenuItem>
              </Select>
            </FormControl>

            {newProvider.type === 'api' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Provider</InputLabel>
                  <Select
                    value={newProvider.name ?? ''}
                    label="Provider"
                    onChange={(e) => {
                      const providerName = e.target.value as string;
                      let baseUrl = '';
                      
                      // Set default URLs for known providers
                      if (providerName === 'NovelAI') {
                        baseUrl = 'https://api.novelai.net';
                      } else if (providerName === 'OpenAI') {
                        baseUrl = 'https://api.openai.com';
                      } else if (providerName === 'Anthropic') {
                        baseUrl = 'https://api.anthropic.com';
                      }
                      
                      setNewProvider({ 
                        ...newProvider, 
                        name: providerName,
                        baseUrl: newProvider.baseUrl || baseUrl
                      });
                    }}
                  >
                    <MenuItem value="">Custom</MenuItem>
                    <MenuItem value="NovelAI">NovelAI</MenuItem>
                    <MenuItem value="OpenAI">OpenAI</MenuItem>
                    <MenuItem value="Anthropic">Anthropic</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  label="Base URL"
                  value={newProvider.baseUrl ?? ''}
                  onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="API Key"
                  type="password"
                  value={newProvider.apiKey ?? ''}
                  onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                  fullWidth
                />
              </>
            )}

            {newProvider.type === 'local' && (
              <TextField
                label="URL"
                value={newProvider.url ?? ''}
                onChange={(e) => setNewProvider({ ...newProvider, url: e.target.value })}
                fullWidth
                helperText="Example: http://localhost:5000"
              />
            )}

            {testResponse.providerInfo?.modelOptions && testResponse.providerInfo.modelOptions.length > 0 ? (
              <FormControl fullWidth>
                <InputLabel>Model</InputLabel>
                <Select
                  value={newProvider.model ?? ''}
                  label="Model"
                  onChange={(e) => setNewProvider({ ...newProvider, model: e.target.value as string })}
                >
                  {testResponse.providerInfo.modelOptions.map((model) => (
                    <MenuItem key={model} value={model}>{model}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>Detected models from the provider</FormHelperText>
              </FormControl>
            ) : (
              <TextField
                label="Model (Optional)"
                value={newProvider.model ?? ''}
                onChange={(e) => setNewProvider({ ...newProvider, model: e.target.value })}
                fullWidth
                helperText="Model name or identifier if required by the provider"
              />
            )}

            <Stack spacing={2}>
              <Button
                variant="outlined"
                onClick={async () => {
                  if (
                    !newProvider.type ||
                    (newProvider.type === 'api' && (!newProvider.baseUrl || !newProvider.apiKey)) ||
                    (newProvider.type === 'local' && !newProvider.url)
                  ) {
                    setTestResponse({ ok: false, message: 'Please fill in required fields first' })
                    return
                  }

                  setTestResponse({ ok: false, testing: true })
                  const result = await testProvider(newProvider as AIProvider)
                  setTestResponse(result)

                  if (result.ok && result.providerInfo) {
                    setNewProvider(prev => ({
                      ...prev,
                      name: prev.name || result.providerInfo?.name,
                      model: result.providerInfo?.modelOptions?.[0]
                    }))
                  }
                }}
                disabled={testResponse.testing}
                startIcon={testResponse.testing ? <CircularProgress size={20} /> : null}
              >
                Test Connection
              </Button>

              {testResponse.message && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: testResponse.ok ? 'success.main' : 'error.main' }}>
                  {testResponse.ok ? <CheckIcon /> : <ErrorIcon />}
                  <Typography>{testResponse.message}</Typography>
                </Box>
              )}

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleSaveNewProvider}
                  disabled={
                    !newProvider.name ||
                    !newProvider.type ||
                    (newProvider.type === 'api' && (!newProvider.baseUrl || !newProvider.apiKey)) ||
                    (newProvider.type === 'local' && !newProvider.url)
                  }
                >
                  Save
                </Button>
                <Button onClick={() => setIsAdding(false)}>Cancel</Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export default AIProviderSettings