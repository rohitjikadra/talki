'use client'

import { forwardRef, useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import { createFilterOptions, Slide } from '@mui/material'
import { toast } from 'react-toastify'

import Languages from '../../../../../src/languages'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

// Actions
import { createListener, fetchDropdownUser, fetchListeners, updateListener } from '@/redux-store/slices/listener'

// Utilities
import CustomAutocomplete from '@/@core/components/mui/Autocomplete'
import CustomAvatar from '@/@core/components/mui/Avatar'
import CustomIconButton from '@/@core/components/mui/IconButton'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { fetchTalkTopics } from '@/redux-store/slices/talkTopics'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { getInitials } from '@/utils/getInitials'
import { baseURL } from '@/config'

const urlToFile = async (url, filename, mimeType) => {
  const response = await fetch(url)
  const blob = await response.blob()

  return new File([blob], filename, { type: mimeType })
}

const normalizeValue = value => {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

// Define validation schema

const appendIfChanged = (formData, key, newValue, oldValue) => {
  // Ignore undefined or empty strings
  if (newValue === undefined || newValue === '') return false

  // Handle arrays
  if (Array.isArray(newValue)) {
    const n = newValue.join(',')
    const o = Array.isArray(oldValue) ? oldValue.join(',') : ''
    if (n !== o) {
      formData.append(key, n)
      return true
    }
    return false
  }

  // Normalize before compare
  const normalizedNew = normalizeValue(newValue)
  const normalizedOld = normalizeValue(oldValue)

  if (normalizedNew !== normalizedOld) {
    formData.append(key, normalizedNew)
    return true
  }

  return false
}

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  nickName: yup.string().required('Nickname is required'),
  selfIntro: yup.string().required('Self introduction is required'),
  language: yup.array().min(1, 'At least one language is required'),
  talkTopics: yup.array().min(1, 'At least one talk topic is required'),
  ratePrivateVideoCall: yup.number().typeError('Must be a number').min(1, 'Must be greater than 0').required('Rate is required'),
  ratePrivateAudioCall: yup.number().typeError('Must be a number').min(1, 'Must be greater than 0').required('Rate is required'),
  rateRandomVideoCall: yup.number().typeError('Must be a number').min(1, 'Must be greater than 0').required('Rate is required'),
  rateRandomAudioCall: yup.number().typeError('Must be a number').min(1, 'Must be greater than 0').required('Rate is required'),
  experience: yup.string().when('$listener', {
    is: val => val === null,
    then: schema => schema.required('Experience is required'),
    otherwise: schema => schema.notRequired()
  }),
  phoneNumber: yup.string().when('$listener', {
    is: val => val === null,
    then: schema =>
      schema
        .required('Phone number is required')
        .matches(/^(\+\d{1,4})\d{6,14}$/, 'Enter valid phone number with country code, e.g. +911234567890'),
    otherwise: schema =>
      schema
        .notRequired()
        .matches(/^(\+\d{1,4})\d{6,14}$/, 'Enter valid phone number with country code, e.g. +911234567890')
  }),
  location: yup.string().when('$listener', {
    is: val => val === null,
    then: schema => schema.required('Location is required'),
    otherwise: schema => schema.notRequired()
  }),
  age: yup.string().when('$listener', {
    is: val => val === null,
    then: schema => schema.required('Age is required'),
    otherwise: schema => schema.notRequired()
  }),
  userId: yup.string().when(['$role', '$listener'], {
    is: (role, listener) => role === 'real' && !listener,
    then: schema => schema.required('User ID is required'),
    otherwise: schema => schema.notRequired()
  })
})

const getAvatar = params => {
  const { avatar, fullName } = params

  if (avatar) {
    return <CustomAvatar src={avatar} size={34} />
  } else {
    return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
  }
}

const ListenerDialog = ({ open, onClose, listener = null, role }) => {
  const dispatch = useDispatch()
  const { talkTopics } = useSelector(state => state.talkTopicsReducer)
  const { dropDownUser } = useSelector(state => state.listener)
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [video, setVideo] = useState([])
  const [tempVideo, setTempVideo] = useState([])
  const [previewImage, setPreviewImage] = useState('')
  const [languages, setLanguages] = useState([])
  const [talkTopicsKey, setTalkTopicsKey] = useState([])
  const [isVideoChange, setIsVideoChange] = useState(false)
  const [audioFiles, setAudioFiles] = useState([])
  const [isAudioChange, setIsAudioChange] = useState(false)
  const [removeVideoIndexes, setRemoveVideoIndexes] = useState([])

  const { profileData } = useSelector(state => state.adminSlice)


  const getIndexByName = (name, arr) => {
    return arr.indexOf(name)
  }

  // Fetch available languages and talk topics from API
  useEffect(() => {
    if (!talkTopics.length) {
      dispatch(fetchTalkTopics())
    }

    if (role === 'real') {
      dispatch(fetchDropdownUser())
    }
  }, [dispatch, role, talkTopics.length])

  useEffect(() => {
    setLanguages(Languages.map(item => item.name))
    setTalkTopicsKey(talkTopics.map(item => item.name))
  }, [talkTopics])

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    clearErrors,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(schema),
    context: { listener, role },
    defaultValues: {
      name: '',
      email: '',
      selfIntro: '',
      language: [],
      talkTopics: [],
      ratePrivateVideoCall: 0,
      ratePrivateAudioCall: 0,
      rateRandomVideoCall: 0,
      rateRandomAudioCall: 0,
      experience: '',
      phoneNumber: '+',
      location: '',
      age: '',
      nickName: '',
      userId: ''
    }
  })

  // Initialize form with listener data when editing
  useEffect(() => {
    if (open) {
      if (listener) {
        reset({
          name: listener.name || '',
          email: listener.email || '',
          selfIntro: listener.selfIntro || '',
          language: listener.language || [],
          talkTopics: listener.talkTopics || [],
          ratePrivateVideoCall: listener.ratePrivateVideoCall || 0,
          ratePrivateAudioCall: listener.ratePrivateAudioCall || 0,
          rateRandomVideoCall: listener.rateRandomVideoCall || 0,
          rateRandomAudioCall: listener.rateRandomAudioCall || 0,
          experience: listener.experience || '',
          phoneNumber: listener.phoneNumber || '',
          location: listener.location || '',
          age: listener.age || '',
          nickName: listener.nickName || '',
          userId: listener.userId || ''
        })

        // Set preview image if exists
        if (listener.image) {
          setPreviewImage(getFullImageUrl(listener.image))
        }

        // Set video files if exists
        if (role === 'fake' && listener.video && listener.video.length) {
          setVideo([...listener.video])
          setTempVideo([...listener.video])
        }

        // Set audio files if exists
        if (role === 'fake' && listener.audio && listener.audio.length) {
          const AudioArray = typeof listener.audio === 'string' ? [listener.audio] : listener.audio

          setAudioFiles(AudioArray)
        }
      } else {
        handleResetForm()
        setPreviewImage('')
        setImageFile(null)
        setVideo([])
        setTempVideo([])
        setAudioFiles([])
        setRemoveVideoIndexes([])
      }
      clearErrors()
    }
  }, [open, listener, reset])

  const handleImageChange = e => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')

        return
      }

      setImageFile(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleVideoChange = e => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)

      // Validate file types
      const validFiles = files.filter(file => file.type.startsWith('video/'))

      if (validFiles.length !== files.length) {
        toast.error('Please select only video files')

        return
      }

      setVideo(prev => [...prev, ...validFiles])
      setIsVideoChange(true)
    }
  }

  const handleAudioChange = e => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)

      // Validate file types
      const validFiles = files.filter(file => file.type.startsWith('audio/'))

      if (validFiles.length !== files.length) {
        toast.error('Please select only audio files')

        return
      }

      setAudioFiles(validFiles)

      // setAudioFiles(prev => [...prev, ...validFiles])
      setIsAudioChange(true)
    }
  }

  const removeVideo = (index, name) => {
    const updatedVideo = video.filter((_, ind) => ind !== index)

    if (name) {
      const removeIndex = getIndexByName(name, tempVideo)

      console.log(removeIndex)

      setRemoveVideoIndexes([...removeVideoIndexes, removeIndex])
    }

    setVideo(updatedVideo)
    setIsVideoChange(true)
  }

  const removeAudio = index => {
    const updatedAudio = audioFiles.filter((_, ind) => ind !== index)

    setAudioFiles(updatedAudio)
    setIsAudioChange(true)
  }


  const onSubmit = async data => {
    try {
      setLoading(true)

      const formData = new FormData()

      if (listener) {
        let hasChanges = false

        if (removeVideoIndexes.length) {
          formData.append('removeVideoIndexes', JSON.stringify(removeVideoIndexes))
          hasChanges = true
        }

        Object.keys(data).forEach(key => {
          if (appendIfChanged(formData, key, data[key], listener[key])) {
            hasChanges = true
          }
        })

        if (imageFile) {
          formData.append('image', imageFile)
          hasChanges = true
        }

        if (role === 'fake' && isVideoChange) {
          video.forEach(v => v instanceof File && formData.append('video', v))
          hasChanges = true
        }

        if (role === 'fake' && isAudioChange) {
          audioFiles.forEach(a => a instanceof File && formData.append('audio', a))
          hasChanges = true
        }

        if (!hasChanges) {
          onClose()

          return
        }

        await dispatch(updateListener({ listenerId: listener._id, formData }))
      } else {
        // ---------- CREATE MODE ----------

        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            formData.append(key, data[key].join(','))
          } else {
            formData.append(key, data[key])
          }
        })

        if (imageFile) formData.append('image', imageFile)

        if (role === 'fake') {
          video.forEach(v => v instanceof File && formData.append('video', v))
          audioFiles.forEach(a => a instanceof File && formData.append('audio', a))
        }

        await dispatch(createListener(formData))
      }

      onClosePopup()
    } catch (error) {
      console.error('Error saving listener:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetForm = () => {
    reset({
      name: '',
      email: '',
      selfIntro: '',
      language: [],
      talkTopics: [],
      ratePrivateVideoCall: 0,
      ratePrivateAudioCall: 0,
      rateRandomVideoCall: 0,
      rateRandomAudioCall: 0,
      experience: '',
      phoneNumber: '',
      location: '',
      age: '',
      nickName: '',
      userId: ''
    })
    setIsVideoChange(false)
    setIsAudioChange(false)
  }

  const onClosePopup = (_, reason) => {
    if (reason !== 'backdropClick') {
      onClose()
    }
  }

  const filterOptions = createFilterOptions({
    stringify: option => `${option.fullName} ${option.nickName} ${option.uniqueId}`
  })

  return (
    <Dialog
      open={open}
      onClose={onClosePopup}
      keepMounted
      disableEscapeKeyDown
      TransitionComponent={Transition}
      aria-labelledby='listener-dialog-title'
      fullWidth
      maxWidth='md'
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '850px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle id='listener-dialog-title'>
        <Typography variant='h5' component='span'>
          {listener ? 'Edit Listener' : 'Create Listener'}
        </Typography>
        <DialogCloseButton onClick={onClosePopup} disabled={loading}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={4} className='mt-1'>
          <Grid item xs={12} md={12}>
            <Grid container spacing={3}>
              {role === 'real' && !listener ? (
                <Grid item size={6}>
                  <Controller
                    name='userId'
                    control={control}
                    render={({ field }) => (
                      <CustomAutocomplete
                        fullWidth
                        id='autocomplete-custom'
                        options={dropDownUser || []}
                        filterOptions={filterOptions}
                        getOptionLabel={option => option?.fullName || ''}
                        value={dropDownUser?.find(option => option?._id === field.value) || null}
                        onChange={(event, newValue) => {
                          field.onChange(newValue?._id || '')
                        }}
                        renderOption={(props, option) => {
                          const { key, ...rest } = props

                          return (
                            <li key={key} {...rest}>
                              <div className='flex items-center gap-4'>
                                {getAvatar({
                                  avatar: getFullImageUrl(option?.profilePic),
                                  fullName: option?.fullName
                                })}
                                <div className='flex flex-col'>
                                  <Typography color='text.primary' className='font-medium'>
                                    {option?.fullName || '-'}
                                  </Typography>
                                  {option.nickName && (
                                    <Typography variant='body2'>
                                      {option.nickName} || {option.uniqueId}
                                    </Typography>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        }}
                        renderInput={params => (
                          <TextField
                            label='User'
                            fullWidth
                            {...params}
                            error={!!errors.userId}
                            helperText={errors.userId?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
              ) : null}

              <Grid item size={6}>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Name'
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item size={6}>
                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Email'
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item size={6}>
                <Controller
                  name='nickName'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Nickname'
                      fullWidth
                      error={!!errors.nickName}
                      helperText={errors.nickName?.message}
                    />
                  )}
                />
              </Grid>

              {/* Location field - only for new listeners */}
              {!listener && (
                <>
                  <Grid item size={6}>
                    <Controller
                      name='location'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Location'
                          fullWidth
                          error={!!errors.location}
                          helperText={errors.location?.message}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              {/* Age field - only for new listeners */}
              {!listener && (
                <>
                  <Grid item size={6}>
                    <Controller
                      name='age'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Age'
                          type='number'
                          fullWidth
                          error={!!errors.age}
                          helperText={errors.age?.message}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              <Grid item size={6}>
                <CustomAutocomplete
                  multiple
                  id='autocomplete-grouped'
                  getOptionLabel={option => option || ''}
                  onChange={(event, newValue) => {
                    setValue('language', newValue)
                  }}
                  value={watch('language')}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Languages'
                      variant='outlined'
                      error={!!errors.language}
                      helperText={errors.language?.message}
                    />
                  )}
                  options={languages}
                />
              </Grid>

              <Grid item size={6}>
                <CustomAutocomplete
                  multiple
                  id='autocomplete-grouped'
                  getOptionLabel={option => option || ''}
                  onChange={(event, newValue) => {
                    setValue('talkTopics', newValue)
                  }}
                  value={watch('talkTopics')}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Talk Topics'
                      variant='outlined'
                      error={!!errors.talkTopics}
                      helperText={errors.talkTopics?.message}
                      value={watch('talkTopics')}
                    />
                  )}
                  options={talkTopicsKey}
                />
                {!!errors.langtalkTopicsuage && (
                  <FormHelperText color={'error'}>{errors.talkTopics.message}</FormHelperText>
                )}
              </Grid>

              {/* Experience field - only for new listeners */}
              {!listener && (
                <Grid item size={6}>
                  <Controller
                    name='experience'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label='Experience'
                        type='number'
                        fullWidth
                        error={!!errors.experience}
                        helperText={errors.experience?.message}
                        InputProps={{ inputProps: { min: 0 } }}
                      />
                    )}
                  />
                </Grid>
              )}

              <Grid item size={6}>
                <Controller
                  name='phoneNumber'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Phone Number'
                      type='tel'
                      fullWidth
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber?.message || 'Example: +91XXXXXXXXXX'}
                      onChange={e => {
                        let value = e.target.value // Allow only "+" at start and digits
                        value = value.replace(/[^+\d]/g, '') // Remove all except + and digits
                        if (!value.startsWith('+')) {
                          value = '+' + value.replace(/\+/g, '')
                        } // Remove all additional '+' except at first position
                        value = value[0] + value.slice(1).replace(/\+/g, '')
                        field.onChange(value)
                      }}
                      inputProps={{ maxLength: 15 }}
                      FormHelperTextProps={{
                        style: { fontSize: '0.75rem', color: '#d32f2f', marginTop: '2px' }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item size={12}>
                {/* <Grid item xs={listener ? 12 : 6}> */}
                <Controller
                  name='selfIntro'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Self Introduction'
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.selfIntro}
                      helperText={errors.selfIntro?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item size={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant='subtitle1' marginBottom={4} gutterBottom>
              Call Rates
            </Typography>
            <Grid container spacing={3}>
              <Grid item size={6}>
                <Controller
                  name='ratePrivateVideoCall'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Private Video Call Rate'
                      type='number'
                      fullWidth
                      error={!!errors.ratePrivateVideoCall}
                      helperText={errors.ratePrivateVideoCall?.message}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  )}
                />
              </Grid>
              <Grid item size={6}>
                <Controller
                  name='ratePrivateAudioCall'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Private Audio Call Rate'
                      type='number'
                      fullWidth
                      error={!!errors.ratePrivateAudioCall}
                      helperText={errors.ratePrivateAudioCall?.message}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  )}
                />
              </Grid>
              <Grid item size={6}>
                <Controller
                  name='rateRandomVideoCall'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Random Video Call Rate'
                      type='number'
                      fullWidth
                      error={!!errors.rateRandomVideoCall}
                      helperText={errors.rateRandomVideoCall?.message}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  )}
                />
              </Grid>
              <Grid item size={6}>
                <Controller
                  name='rateRandomAudioCall'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Random Audio Call Rate'
                      type='number'
                      fullWidth
                      error={!!errors.rateRandomAudioCall}
                      helperText={errors.rateRandomAudioCall?.message}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item size={12}>
            <Typography variant='subtitle1' marginBottom={2} gutterBottom>
              Profile Image
            </Typography>
            <Box>
              {previewImage && (
                <div className='mt-2 w-full'>
                  <Box className='border p-2 rounded flex justify-between w-full items-center'>
                    <div className='flex items-center gap-4'>
                      <CustomAvatar size={60} variant='rounded' src={previewImage} />
                    </div>
                    <div
                      className=''
                      onClick={() => {
                        setImageFile(null)
                        setPreviewImage(null)
                      }}
                    >
                      <CustomIconButton aria-label='capture screenshot' color='error'>
                        <i className='tabler-trash' />
                      </CustomIconButton>
                    </div>
                  </Box>
                </div>
              )}
              {!previewImage && (
                <>
                  <Button variant='outlined' className='w-full' component='label' sx={{ mt: 1 }}>
                    Upload Image
                    <input type='file' accept='image/png, image/jpeg, image/jpg' hidden onChange={handleImageChange} />
                  </Button>
                  <p className='text-xs text-error mt-0.5'>Accept only .png, .jpeg and .jpg</p>
                </>
              )}
            </Box>
          </Grid>

          {/* Video Upload Section - Only for fake listeners */}
          {role === 'fake' && (
            <>
              <Grid item size={6}>
                <Typography variant='subtitle1' marginBottom={1}>
                  Video Upload
                </Typography>
                <Box>
                  <Button variant='outlined' className='w-full' component='label' sx={{ mt: 1 }}>
                    Upload Video
                    <input type='file' multiple accept='video/*' hidden onChange={handleVideoChange} />
                  </Button>
                  <p className='text-xs text-error mt-0.5'>Accept only .mp4.</p>
                </Box>
              </Grid>
              {/* Video Preview */}
            </>
          )}

          {role === 'fake' && (
            <>
              <Grid item size={6}>
                <Typography variant='subtitle1' marginBottom={1}>
                  Audio Upload
                </Typography>
                <Box>
                  <Button variant='outlined' className='w-full' component='label' sx={{ mt: 1 }}>
                    Upload Audio
                    <input type='file' multiple accept='audio/mp3,audio/mpeg' hidden onChange={handleAudioChange} />
                  </Button>
                  <p className='text-xs text-error mt-0.5'>Accept only .mp3</p>
                </Box>
              </Grid>
            </>
          )}
          <Grid item size={6}>
            {video && video.length ? (
              <>
                {video.map((item, i) => {
                  const isFile = item instanceof File

                  return (
                    <Grid size={12} key={i}>
                      <div className='mt-2 w-full'>
                        <Box className='border p-2 rounded flex justify-between w-full items-center'>
                          <div className='flex items-center gap-4'>
                            <video
                              width='75'
                              height={75}
                              controls
                              src={isFile ? URL.createObjectURL(item) : baseURL + '/' + item}
                            ></video>
                          </div>
                          <div
                            className=''
                            onClick={() => {
                              removeVideo(i, !isFile ? item : '')
                            }}
                          >
                            <CustomIconButton aria-label='capture screenshot' color='error'>
                              <i className='tabler-trash' />
                            </CustomIconButton>
                          </div>
                        </Box>
                      </div>
                    </Grid>
                  )
                })}
              </>
            ) : (
              ''
            )}
          </Grid>

          <Grid item size={6}>
            {/*  Audio Preview */}
            {audioFiles.length > 0 && (
              <>
                {audioFiles.map((item, i) => {
                  const isFile = item instanceof File

                  return (
                    <Grid size={12} key={i}>
                      <Box className='border p-2 rounded flex justify-between w-full items-center mt-2' height={93}>
                        <audio controls src={isFile ? URL.createObjectURL(item) : baseURL + '/' + item} />
                        <CustomIconButton
                          color='error'
                          onClick={() => {
                            setAudioFiles(audioFiles.filter((_, idx) => idx !== i))
                            setIsAudioChange(true)
                          }}
                        >
                          <i className='tabler-trash' />
                        </CustomIconButton>
                      </Box>
                    </Grid>
                  )
                })}
              </>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClosePopup} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => {


            handleSubmit(onSubmit)()
          }}
          variant='contained'
          color='primary'
          disabled={
            loading ||
            Object.keys(errors).length > 0 ||
            (listener &&
              !(() => {
                const data = watch()
                const formDataCheck = new FormData()
                let changed = removeVideoIndexes.length > 0 || !!imageFile || isVideoChange || isAudioChange
                if (changed) return true
                Object.keys(data).forEach(key => {
                  if (appendIfChanged(formDataCheck, key, data[key], listener[key])) {
                    changed = true
                  }
                })
                return changed
              })())
          }
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : listener ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ListenerDialog
