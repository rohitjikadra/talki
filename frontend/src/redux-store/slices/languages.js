'use client'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

import { secretKey, baseURL } from '@/config'

// ─── Auth Headers ────────────────────────────────────────────────────────────
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    const uid = localStorage.getItem('uid')

    return {
      'Content-Type': 'application/json',
      key: secretKey,
      Authorization: `Bearer ${token}`,
      'x-admin-uid': uid
    }
  }

  return {}
}

const getMultipartHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    const uid = localStorage.getItem('uid')

    return {
      key: secretKey,
      Authorization: `Bearer ${token}`,
      'x-admin-uid': uid
    }
  }

  return {}
}

const getListParamsFromState = thunkAPI => {
  const state = thunkAPI.getState()?.languages || {}

  return {
    page: state.page || 1,
    pageSize: state.pageSize || 10,
    search: state.searchQuery || ''
  }
}

// ─── Thunks ──────────────────────────────────────────────────────────────────

// Get all languages (paginated + search)
export const fetchLanguages = createAsyncThunk(
  'languages/fetchLanguages',
  async ({ page = 1, pageSize = 10, search = '' } = {}, thunkAPI) => {
    try {
      const response = await axios.get(`${baseURL}/api/admin/language/getEntireLanguages`, {
        headers: getAuthHeaders(),
        params: { start: page, limit: pageSize, search: search || undefined }
      })

      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Create language (multipart: languageIcon, languageTitle, languageCode, localLanguageTitle)
export const createLanguage = createAsyncThunk(
  'languages/createLanguage',
  async (formData, thunkAPI) => {
    try {
      const response = await axios.post(`${baseURL}/api/admin/language/createALanguage`, formData, {
        headers: getMultipartHeaders()
      })

      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Update language (multipart: languageCode, languageTitle, localLanguageTitle, languageIcon?)
export const updateLanguage = createAsyncThunk(
  'languages/updateLanguage',
  async (formData, thunkAPI) => {
    try {
      const response = await axios.patch(`${baseURL}/api/admin/language/updateOneLanguage`, formData, {
        headers: getMultipartHeaders()
      })

      if (response.data?.status) {
        thunkAPI.dispatch(fetchLanguages(getListParamsFromState(thunkAPI)))
      }

      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Delete language
export const deleteLanguage = createAsyncThunk(
  'languages/deleteLanguage',
  async (languageCode, thunkAPI) => {
    try {
      const response = await axios.delete(`${baseURL}/api/admin/language/deleteOneLanguage`, {
        headers: getAuthHeaders(),
        params: { languageCode }
      })

      if (response.data?.status) {
        thunkAPI.dispatch(fetchLanguages(getListParamsFromState(thunkAPI)))
      }

      return { ...response.data, languageCode }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Toggle isActive (toggleType=1) or isDefault (toggleType=2)
export const toggleLanguageSwitch = createAsyncThunk(
  'languages/toggleLanguageSwitch',
  async ({ languageCode, toggleType }, thunkAPI) => {
    try {
      const response = await axios.patch(
        `${baseURL}/api/admin/language/toggleActiveAndDefaultSwitch`,
        {},
        {
          headers: getAuthHeaders(),
          params: { languageCode, toggleType }
        }
      )

      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Get translations for a single language
export const fetchLanguageTranslations = createAsyncThunk(
  'languages/fetchLanguageTranslations',
  async ({ languageCode, module }, thunkAPI) => {
    try {
      const response = await axios.get(`${baseURL}/api/admin/translation/getOneLanguageTranslations`, {
        headers: getAuthHeaders(),
        params: { languageCode, module }
      })

      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

console.log(getAuthHeaders());

// Update translations for a language (tab / module at a time)
export const updateLanguageTranslations = createAsyncThunk(
  'languages/updateLanguageTranslations',
  async ({ languageCode, module, translations }, thunkAPI) => {
    try {
      const response = await axios.patch(
        `${baseURL}/api/admin/translation/updateTranslationsOfLanguage`,
        { languageCode, module, translations },
        { headers: getAuthHeaders() }
      )

      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Upload CSV file for translations
export const uploadTranslationsCSV = createAsyncThunk(
  'languages/uploadTranslationsCSV',
  async (file, thunkAPI) => {
    try {
      const formData = new FormData()

      formData.append('file', file)
      const response = await axios.post(`${baseURL}/api/admin/translation/uploadFile`, formData, {
        headers: getMultipartHeaders()
      })

      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Download all translations as CSV (blob)
export const downloadTranslationsCSV = createAsyncThunk(
  'translation/downloadTranslationsCSV',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${baseURL}/api/admin/translation/downloadTranslationsCSV`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      })

      // Trigger browser download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')

      link.href = url
      link.setAttribute('download', 'translations.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      return { status: true }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// ─── Initial State ───────────────────────────────────────────────────────────
const initialState = {
  languages: [],
  total: 0,
  page: 1,
  pageSize: 10,
  searchQuery: '',
  loading: false,
  initialLoading: true,
  error: null,
  // Translations dialog
  translations: { app: {}, web: {} },
  translationsLoading: false,
  translationsError: null,
  downloadLoading: false,
  uploadLoading: false
}

// ─── Slice ───────────────────────────────────────────────────────────────────
const languagesSlice = createSlice({
  name: 'languages',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
      state.page = 1
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
      state.page = 1
    },
    clearTranslations: state => {
      state.translations = { app: {}, web: {} }
      state.translationsError = null
    }
  },
  extraReducers: builder => {
    // ── fetchLanguages ──────────────────────────────────────────────────────
    builder
      .addCase(fetchLanguages.pending, state => {
        state.initialLoading = true
        state.error = null
      })
      .addCase(fetchLanguages.fulfilled, (state, action) => {
        state.initialLoading = false

        if (action.payload.status) {
          state.languages = action.payload.data || []
          state.total = action.payload.total || 0
          state.error = null
        } else {
          state.error = action.payload.message
          toast.error(action.payload.message)
        }
      })
      .addCase(fetchLanguages.rejected, (state, action) => {
        state.initialLoading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── createLanguage ──────────────────────────────────────────────────────
    builder
      .addCase(createLanguage.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(createLanguage.fulfilled, (state, action) => {
        state.loading = false

        if (action.payload.status) {
          state.languages = [action.payload.data, ...state.languages]
          state.total += 1
          state.error = null
          toast.success(action.payload.message)
        } else {
          state.error = action.payload.message
          toast.error(action.payload.message)
        }
      })
      .addCase(createLanguage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── updateLanguage ──────────────────────────────────────────────────────
    builder
      .addCase(updateLanguage.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(updateLanguage.fulfilled, (state, action) => {
        state.loading = false

        if (action.payload.status) {
          const idx = state.languages.findIndex(l => l.languageCode === action.payload.data?.languageCode)

          if (idx !== -1) state.languages[idx] = action.payload.data
          state.error = null
          toast.success(action.payload.message)
        } else {
          state.error = action.payload.message
          toast.error(action.payload.message)
        }
      })
      .addCase(updateLanguage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── deleteLanguage ──────────────────────────────────────────────────────
    builder
      .addCase(deleteLanguage.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteLanguage.fulfilled, (state, action) => {
        state.loading = false

        if (action.payload.status) {
          state.languages = state.languages.filter(l => l.languageCode !== action.payload.languageCode)
          state.total = Math.max(0, state.total - 1)
          state.error = null
          toast.success(action.payload.message)
        } else {
          state.error = action.payload.message
          toast.error(action.payload.message)
        }
      })
      .addCase(deleteLanguage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── toggleLanguageSwitch ────────────────────────────────────────────────
    builder
      .addCase(toggleLanguageSwitch.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(toggleLanguageSwitch.fulfilled, (state, action) => {
        state.loading = false

        if (action.payload.status) {
          const updated = action.payload.data
          const { languageCode, toggleType } = action.meta.arg || {}

          if (updated) {
            const idx = state.languages.findIndex(l => l.languageCode === updated.languageCode)

            if (idx !== -1) {
              state.languages[idx] = updated

              // If this language was set as default (toggleType 2), clear others
              if (toggleType === 2 && updated.isDefault) {
                state.languages.forEach(l => {
                  if (l.languageCode !== updated.languageCode) l.isDefault = false
                })
              }
            }
          } else {
            // Fallback: toggle locally if backend doesn't return the updated document
            const idx = state.languages.findIndex(l => l.languageCode === languageCode)

            if (idx !== -1) {
              if (toggleType === 1) {
                state.languages[idx].isActive = !state.languages[idx].isActive
              }

              if (toggleType === 2) {
                const newValue = !state.languages[idx].isDefault

                state.languages[idx].isDefault = newValue

                // If toggled ON, clear others
                if (newValue) {
                  state.languages.forEach(l => {
                    if (l.languageCode !== languageCode) l.isDefault = false
                  })
                }
              }
            }
          }

          state.error = null
          toast.success(action.payload.message)
        } else {
          state.error = action.payload.message
          toast.error(action.payload.message)
        }
      })
      .addCase(toggleLanguageSwitch.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── fetchLanguageTranslations ───────────────────────────────────────────
    builder
      .addCase(fetchLanguageTranslations.pending, state => {
        state.translationsLoading = true
        state.translationsError = null
      })
      .addCase(fetchLanguageTranslations.fulfilled, (state, action) => {
        state.translationsLoading = false

        if (action.payload.status) {
          const { module } = action.meta.arg
          const doc = action.payload.doc || {}

          state.translations[module] = doc.translations ? { ...doc.translations } : {}
        } else {
          state.translationsError = action.payload.message
          toast.error(action.payload.message)
        }
      })
      .addCase(fetchLanguageTranslations.rejected, (state, action) => {
        state.translationsLoading = false
        state.translationsError = action.payload
        toast.error(action.payload)
      })

    // ── updateLanguageTranslations ──────────────────────────────────────────
    builder
      .addCase(updateLanguageTranslations.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(updateLanguageTranslations.fulfilled, (state, action) => {
        state.loading = false

        if (action.payload.status) {
          state.error = null
          toast.success(action.payload.message)
        } else {
          state.error = action.payload.message
          toast.error(action.payload.message)
        }
      })
      .addCase(updateLanguageTranslations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── uploadTranslationsCSV ───────────────────────────────────────────────
    builder
      .addCase(uploadTranslationsCSV.pending, state => {
        state.uploadLoading = true
        state.error = null
      })
      .addCase(uploadTranslationsCSV.fulfilled, (state, action) => {
        state.uploadLoading = false

        if (action.payload.status) {
          state.error = null
          toast.success(action.payload.message)
        } else {
          state.error = action.payload.message
          toast.error(action.payload.message)
        }
      })
      .addCase(uploadTranslationsCSV.rejected, (state, action) => {
        state.uploadLoading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── downloadTranslationsCSV ─────────────────────────────────────────────
    builder
      .addCase(downloadTranslationsCSV.pending, state => {
        state.downloadLoading = true
        state.error = null
      })
      .addCase(downloadTranslationsCSV.fulfilled, state => {
        state.downloadLoading = false
        state.error = null
      })
      .addCase(downloadTranslationsCSV.rejected, (state, action) => {
        state.downloadLoading = false
        state.error = action.payload
        toast.error(action.payload)
      })
  }
})

export const { setPage, setPageSize, setSearchQuery, clearTranslations } = languagesSlice.actions

export default languagesSlice.reducer
