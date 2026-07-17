'use client'

import { forwardRef, useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Slide from '@mui/material/Slide'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { toast } from 'react-toastify'

import CustomAvatar from '@/@core/components/mui/Avatar'
import CustomIconButton from '@/@core/components/mui/IconButton'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { createLanguage, updateLanguage } from '@/redux-store/slices/languages'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { getModifiedFields } from '@/utils/objectUtils'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const LanguageDialog = ({ open, onClose, language = null }) => {
  const dispatch = useDispatch()
  const { loading } = useSelector(state => state.languages)
  const { profileData } = useSelector(state => state.adminSlice)


  const isEdit = !!language

  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [localTitle, setLocalTitle] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewImage, setPreviewImage] = useState('')
  const [errors, setErrors] = useState({})

  // Populate fields when editing
  useEffect(() => {
    if (open) {
      if (language) {
        setTitle(language.languageTitle || '')
        setCode(language.languageCode || '')
        setLocalTitle(language.localLanguageTitle || '')
        setPreviewImage(language.languageIcon ? getFullImageUrl(language.languageIcon) : '')
        setImageFile(null)
      } else {
        resetForm()
      }
      setErrors({})
    }
  }, [language, open])

  const resetForm = () => {
    setTitle('')
    setCode('')
    setLocalTitle('')
    setImageFile(null)
    setPreviewImage('')
    setErrors({})
  }

  const validate = () => {
    const newErrors = {}

    if (!title.trim()) newErrors.title = 'Language title is required'
    if (!isEdit && !code.trim()) newErrors.code = 'Language code is required'
    if (!localTitle.trim()) newErrors.localTitle = 'Localized title is required'
    if (!isEdit && !imageFile) newErrors.image = 'Language icon is required'
    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleImageChange = e => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')

      return
    }

    setImageFile(file)
    setPreviewImage(URL.createObjectURL(file))
    setErrors(prev => ({ ...prev, image: undefined }))
  }

  const handleClose = () => {
    if (loading) return
    onClose()
  }

  const getChangedData = () => {
    const currentData = {
      languageTitle: title.trim(),
      localLanguageTitle: localTitle.trim()
    }

    // For image, we check if imageFile is present (user uploaded a new one)
    const initialData = {
      languageTitle: language?.languageTitle || '',
      localLanguageTitle: language?.localLanguageTitle || ''
    }

    const modified = getModifiedFields(initialData, currentData)

    if (imageFile) {
      modified.languageIcon = imageFile
    }

    return modified
  }

  const hasChanges = isEdit ? Object.keys(getChangedData()).length > 0 : true

  const handleSubmit = async () => {


    if (!validate()) return

    const formData = new FormData()

    if (!isEdit) {
      formData.append('languageTitle', title.trim())
      formData.append('localLanguageTitle', localTitle.trim())
      formData.append('languageCode', code.trim().toLowerCase())

      if (imageFile) formData.append('languageIcon', imageFile)

      await dispatch(createLanguage(formData))
    } else {
      const changedData = getChangedData()

      if (Object.keys(changedData).length === 0) {
        handleClose()

        return
      }

      formData.append('languageCode', language.languageCode)

      Object.entries(changedData).forEach(([key, value]) => {
        formData.append(key, value)
      })

      await dispatch(updateLanguage(formData))
    }

    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      keepMounted
      disableEscapeKeyDown
      TransitionComponent={Transition}
      fullWidth
      maxWidth='sm'
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '600px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {isEdit ? 'Edit Language' : 'Add New Language'}
        </Typography>
        <DialogCloseButton onClick={handleClose} disabled={loading}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='flex flex-col gap-5 py-4' sx={{ overflowX: 'hidden' }}>
        {/* Language Title */}
        <TextField
          label='Language Title'
          fullWidth
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            setErrors(prev => ({ ...prev, title: undefined }))
          }}
          error={!!errors.title}
          helperText={errors.title}
        />

        {/* Language Code — disabled in edit mode */}
        <TextField
          label='Language Code'
          fullWidth
          value={code}
          disabled={isEdit}
          onChange={e => {
            setCode(e.target.value.toLowerCase())
            setErrors(prev => ({ ...prev, code: undefined }))
          }}
          error={!!errors.code}
          helperText={errors.code || (isEdit ? 'Language code cannot be changed' : 'e.g. en, hi, ru')}
        />

        {/* Localized Title */}
        <TextField
          label='Localized Title'
          fullWidth
          value={localTitle}
          onChange={e => {
            setLocalTitle(e.target.value)
            setErrors(prev => ({ ...prev, localTitle: undefined }))
          }}
          error={!!errors.localTitle}
          helperText={errors.localTitle}
        />

        {/* Image upload */}
        <Box>
          {previewImage ? (
            <Box className='border p-3 rounded flex items-center justify-between'>
              <CustomAvatar variant='rounded' src={previewImage} size={64} />
              <CustomIconButton
                color='error'
                onClick={() => {
                  setImageFile(null)
                  setPreviewImage('')
                }}
              >
                <i className='tabler-trash' />
              </CustomIconButton>
            </Box>
          ) : (
            <>
              <Button
                variant='outlined'
                component='label'
                fullWidth
                startIcon={<i className='tabler-upload' />}
                color={errors.image ? 'error' : 'primary'}
              >
                Upload File
                <input type='file' accept='image/*' hidden onChange={handleImageChange} />
              </Button>
              <Typography variant='caption' color={errors.image ? 'error' : 'text.secondary'} className='mt-1 block'>
                {errors.image || 'Accepted formats: image/*'}
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={loading || (isEdit && !hasChanges)}
          startIcon={loading ? <CircularProgress size={18} /> : null}
        >
          {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LanguageDialog
