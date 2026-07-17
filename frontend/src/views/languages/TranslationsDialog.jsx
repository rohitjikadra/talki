'use client'

import { forwardRef, useEffect, useMemo, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import InputAdornment from '@mui/material/InputAdornment'
import Slide from '@mui/material/Slide'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import {
  clearTranslations,
  fetchLanguageTranslations,
  updateLanguageTranslations
} from '@/redux-store/slices/languages'

import { getModifiedFields, isDeepEqual } from '@/utils/objectUtils'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

/**
 * TranslationsDialog
 * @param {boolean}  open
 * @param {function} onClose
 * @param {object}   language  – full language object
 */
const TranslationsDialog = ({ open, onClose, language }) => {
  const dispatch = useDispatch()
  const { translations, translationsLoading, loading } = useSelector(state => state.languages)
  const { profileData } = useSelector(state => state.adminSlice)

  // Active module tab: 'app' | 'web'
  const [activeTab, setActiveTab] = useState('app')
  const [search, setSearch] = useState('')

  // Local editable copy of translations for both modules
  const [localTranslations, setLocalTranslations] = useState({ app: {}, web: {} })

  // Fetch translations when dialog opens or tab changes
  useEffect(() => {
    if (open && language?.languageCode) {
      dispatch(fetchLanguageTranslations({ languageCode: language.languageCode, module: activeTab }))
      setSearch('')
    }

    if (!open) {
      dispatch(clearTranslations())
      setLocalTranslations({ app: {}, web: {} })
    }
  }, [open, language?.languageCode, activeTab, dispatch])

  // Sync fetched translations into local state when they arrive
  useEffect(() => {
    setLocalTranslations(prev => ({
      ...prev,
      [activeTab]: { ...translations[activeTab] }
    }))
  }, [translations[activeTab]])

  // Filter keys based on search
  const filteredKeys = useMemo(() => {
    const src = localTranslations[activeTab] || {}
    const keys = Object.keys(src)

    if (!search.trim()) return keys

    const q = search.toLowerCase()

    return keys.filter(
      key => key.toLowerCase().includes(q) || (src[key] || '').toLowerCase().includes(q)
    )
  }, [localTranslations, activeTab, search])

  const handleValueChange = (key, value) => {
    setLocalTranslations(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [key]: value }
    }))
  }

  const handleSave = async () => {
    const modifiedTranslations = getModifiedFields(translations[activeTab], localTranslations[activeTab])

    if (Object.keys(modifiedTranslations).length === 0) {
      return
    }

    await dispatch(
      updateLanguageTranslations({
        languageCode: language.languageCode,
        module: activeTab,
        translations: modifiedTranslations
      })
    )
  }

  const handleClose = () => {
    if (loading || translationsLoading) return
    onClose()
  }

  const reduxTranslations = translations[activeTab] || {}
  const localTranslationsForTab = localTranslations[activeTab] || {}

  const hasReduxData = Object.keys(reduxTranslations).length > 0
  const hasLocalData = Object.keys(localTranslationsForTab).length > 0

  // Show loader if we're fetching from API OR if Redux has data but local state hasn't finished syncing yet
  const showLoader = translationsLoading || (hasReduxData && !hasLocalData)

  // Truly no translations found only if both are empty after loading finishes
  const showNoTranslations = !translationsLoading && !hasReduxData && !hasLocalData

  const hasTranslations = hasLocalData || hasReduxData

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      keepMounted
      disableEscapeKeyDown
      TransitionComponent={Transition}
      fullWidth
      maxWidth='md'
      aria-labelledby='translations-dialog-title'
      PaperProps={{
        sx: {
          height: '80vh',
          overflow: 'visible',
          width: '900px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle id='translations-dialog-title' sx={{ p: 4 }}>
        <Typography variant='h5' component='span'>
          Translation for {language?.languageTitle || ''}
        </Typography>
        <DialogCloseButton onClick={handleClose} disabled={loading || showLoader}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      {/* Module Tabs */}
      {/* <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => {
            setActiveTab(val)
            setSearch('')
          }}
        >
          <Tab label='App' value='app' />
          <Tab label='Web' value='web' />
        </Tabs>
      </Box> */}

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: 2,
          overflow: 'hidden',
          overflowX: 'hidden'
        }}
      >
        {/* Search */}
        <TextField
          fullWidth
          size='small'
          placeholder='Search by key, translation'
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <i className='tabler-search text-textSecondary' />
              </InputAdornment>
            )
          }}
        />

        {/* Translations table */}
        {showLoader ? (
          <Box className='flex justify-center items-center flex-1'>
            <CircularProgress />
          </Box>
        ) : showNoTranslations ? (
          <Box className='flex justify-center items-center flex-1'>
            <Typography color='text.secondary'>No translations found for this module.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
            {/* Header row */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                px: 2,
                py: 1,
                borderBottom: '2px solid',
                borderColor: 'divider',
                position: 'sticky',
                top: 0,
                bgcolor: 'background.paper',
                zIndex: 1,
                minWidth: 0
              }}
            >
              <Typography variant='subtitle2' color='primary' fontWeight={600} sx={{ minWidth: 0 }}>
                Key
              </Typography>
              <Typography variant='subtitle2' color='primary' fontWeight={600} sx={{ minWidth: 0 }}>
                Translation
              </Typography>
            </Box>

            {/* Rows */}
            {filteredKeys.length === 0 ? (
              <Box className='flex justify-center py-6'>
                <Typography color='text.secondary'>No results match your search.</Typography>
              </Box>
            ) : (
              filteredKeys.map(key => (
                <Box
                  key={key}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                    minWidth: 0
                  }}
                >
                  <Typography
                    variant='body2'
                    color='text.primary'
                    sx={{ minWidth: 0, overflowWrap: 'anywhere', wordBreak: 'break-word', pr: 1 }}
                  >
                    {key}
                  </Typography>
                  <TextField
                    size='small'
                    fullWidth
                    value={localTranslations[activeTab]?.[key] ?? ''}
                    onChange={e => handleValueChange(key, e.target.value)}
                    variant='outlined'
                    sx={{
                      minWidth: 0,
                      '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' }
                    }}
                  />
                </Box>
              ))
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4 }}>
        <Button onClick={handleClose} variant='outlined' color='secondary' disabled={loading || showLoader}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={
            loading ||
            showLoader ||
            !hasTranslations ||
            isDeepEqual(translations[activeTab], localTranslations[activeTab])
          }
          startIcon={loading ? <CircularProgress size={18} /> : null}
        >
          {loading ? 'Saving...' : 'Save All Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TranslationsDialog
