import { type AppState } from '@/types/app'
import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

const initialState: AppState = {
  theme: (window.localStorage.getItem('theme') as AppState['theme']) ?? 'dark',
  tokenizer:
    (window.localStorage.getItem('tokenizer') as AppState['tokenizer']) ??
    'llama',
  openSettings: false,
  characterCardExportNameTemplate:
    (window.localStorage.getItem(
      'characterCardExportNameTemplate'
    ) as AppState['characterCardExportNameTemplate']) ??
    '{{name}}-spec{{spec}}',
  characterBookExportNameTemplate:
    (window.localStorage.getItem(
      'characterBookExportNameTemplate'
    ) as AppState['characterBookExportNameTemplate']) ??
    '{{name}}-characterBook',
  aiProviders: JSON.parse(window.localStorage.getItem('aiProviders') ?? '[]'),
  selectedAiProvider: window.localStorage.getItem('selectedAiProvider') ?? undefined
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<AppState['theme']>) => {
      window.localStorage.setItem('theme', action.payload)
      return {
        ...state,
        theme: action.payload
      }
    },
    setTokenizer: (state, action: PayloadAction<AppState['tokenizer']>) => {
      window.localStorage.setItem('tokenizer', action.payload)
      return {
        ...state,
        tokenizer: action.payload
      }
    },
    setOpenSettings: (
      state,
      action: PayloadAction<AppState['openSettings']>
    ) => {
      return {
        ...state,
        openSettings: action.payload
      }
    },
    setCharacterCardExportNameTemplate: (
      state,
      action: PayloadAction<AppState['characterCardExportNameTemplate']>
    ) => {
      window.localStorage.setItem(
        'characterCardExportNameTemplate',
        action.payload
      )
      return {
        ...state,
        characterCardExportNameTemplate: action.payload
      }
    },
    setCharacterBookExportNameTemplate: (
      state,
      action: PayloadAction<AppState['characterBookExportNameTemplate']>
    ) => {
      window.localStorage.setItem(
        'characterBookExportNameTemplate',
        action.payload
      )
      return {
        ...state,
        characterBookExportNameTemplate: action.payload
      }
    },
    setAiProviders: (state, action: PayloadAction<AppState['aiProviders']>) => {
      window.localStorage.setItem('aiProviders', JSON.stringify(action.payload))
      return {
        ...state,
        aiProviders: action.payload
      }
    },
    setSelectedAiProvider: (state, action: PayloadAction<AppState['selectedAiProvider']>) => {
      if (action.payload) {
        window.localStorage.setItem('selectedAiProvider', action.payload)
      } else {
        window.localStorage.removeItem('selectedAiProvider')
      }
      return {
        ...state,
        selectedAiProvider: action.payload
      }
    },
    addAiProvider: (state, action: PayloadAction<AppState['aiProviders'][0]>) => {
      const newProviders = [...state.aiProviders, action.payload]
      window.localStorage.setItem('aiProviders', JSON.stringify(newProviders))
      return {
        ...state,
        aiProviders: newProviders
      }
    },
    removeAiProvider: (state, action: PayloadAction<string>) => {
      const newProviders = state.aiProviders.filter(p => p.name !== action.payload)
      window.localStorage.setItem('aiProviders', JSON.stringify(newProviders))
      return {
        ...state,
        aiProviders: newProviders,
        selectedAiProvider: state.selectedAiProvider === action.payload ? undefined : state.selectedAiProvider
      }
    },
    updateAiProvider: (state, action: PayloadAction<AppState['aiProviders'][0]>) => {
      const newProviders = state.aiProviders.map(p => 
        p.name === action.payload.name ? action.payload : p
      )
      window.localStorage.setItem('aiProviders', JSON.stringify(newProviders))
      return {
        ...state,
        aiProviders: newProviders
      }
    }
  }
})

export const {
  setTheme,
  setTokenizer,
  setOpenSettings,
  setCharacterCardExportNameTemplate,
  setCharacterBookExportNameTemplate,
  setAiProviders,
  setSelectedAiProvider,
  addAiProvider,
  removeAiProvider,
  updateAiProvider
} = appSlice.actions

export default appSlice
