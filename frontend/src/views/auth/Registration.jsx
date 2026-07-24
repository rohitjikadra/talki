'use client'

import { useState, useEffect } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useDispatch } from 'react-redux'

// Form & Validation Imports
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import classNames from 'classnames'
import { Box, CircularProgress, Divider, TextField } from '@mui/material'

// Third-party Imports
import { toast } from 'react-toastify'
import { signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth'

import { auth } from '@/libs/firebase'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hooks
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import { loginAdmin, signInAdmin } from '@/redux-store/slices/admin'

// Auth Utils
import { setRememberMe } from '@/utils/firebase-auth'
import { projectName } from '@/config'

import HoverPopover from '@/common/HoverPopover'
import { toolTipData } from '@/settingTooltip'

// Styled Custom Components
const LoginIllustration = styled('div')(({ theme }) => ({
  zIndex: 2,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const PhotoContainer = styled('div')({
  width: '100%',
  position: 'relative',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

const MainImage = styled('img')({
  width: '100%',

  // objectFit: 'contain',
  height: '100dvh',
  objectFit: 'cover'

  // borderRadius: '16px'
})

// Validation Schema
const schema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),

  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),

  cpassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Confirm passwords not match')
    .required('Confirm password is required')
});


// Firebase Error Messages
const firebaseErrorMessages = {
  'auth/user-not-found': 'User does not exist.',
  'auth/wrong-password': 'Invalid password.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/too-many-requests': 'Too many login attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
  'auth/email-already-in-use': 'This email already exits.'
}

const Registration = ({ mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [error, setError] = useState(null)
  const [loadingActualLogin, setLoadingActualLogin] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [rememberMe, setRememberMeState] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'

  // Hooks
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const [privateKeyJson, setPrivateKeyJson] = useState('')
  const [jsonError, setJsonError] = useState('')

  // Form Handling
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      privateKey: '',
    }
  })

  // Check authentication status when component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        // Only proceed with auto-login if we're not in a login flow
        const manualLoginInProgress = typeof window !== 'undefined' ? sessionStorage.getItem('manual_login_in_progress') : null

        if (manualLoginInProgress) {
          // We're in the middle of a manual login flow, don't redirect
          setCheckingAuth(false)

          return
        }

        try {
          // Check if we have valid credentials in localStorage
          const storedUid = typeof window !== 'undefined' ? localStorage.getItem('uid') : null
          const storedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null

          if (storedUid && storedToken) {
            // Verify token with backend before auto-redirecting
            const token = await user.getIdToken(true)

            if (token === storedToken) {
              // Valid token, redirect to dashboard
              const redirectURL = searchParams.get('redirectTo') ?? '/dashboard'

              router.replace(redirectURL)

              return
            }
          }

          // If we get here, tokens are invalid or missing
          setCheckingAuth(false)
        } catch (error) {
          console.error('Error during auth check:', error)
          setCheckingAuth(false)
        }
      } else {
        // User is not logged in
        setCheckingAuth(false)
      }
    })

    return () => unsubscribe() // Cleanup subscription on unmount
  }, [router, searchParams])

  // Toggle Password Visibility
  const handleClickShowPassword = () => setIsPasswordShown(prev => !prev)


  // Handle login (shared function for both login types)
  const handleRegi = async (credentials) => {
    if (loadingActualLogin) return
    setLoadingActualLogin(true)
    setError(null)

    try {
      // Firebase authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email, credentials.password
      );

      const firebaseUser = userCredential.user
      const uid = firebaseUser.uid

      try {
        // Backend authentication
        const response = await dispatch(
          signInAdmin({
            email: credentials.email,
            password: credentials.password,
            privateKey: credentials.privateKey,
            uid
          })
        ).unwrap()

        if (!response?.status) {
          throw new Error(response?.message || 'Authentication failed on server')
        }

        setRememberMe(rememberMe)

        toast.success('Registrtion successful!');

        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
        }, 5000)

      } catch (backendError) {
        console.log('Backend Registration Error:', backendError)

        if (firebaseUser) {
          try {
            await firebaseUser.delete()
            console.warn('Firebase user rolled back successfully')
          } catch (deleteError) {
            console.error('Failed to rollback Firebase user:', deleteError)
          }
        }

        setLoadingActualLogin(false);

        const backendMessage =
          (typeof backendError?.payload === 'string' && backendError.payload) ||
          backendError?.message ||
          (typeof backendError === 'string' ? backendError : null) ||
          'Server authentication failed. Please try again later.'

        setError(backendMessage)
        toast.error(backendMessage)
      }
    } catch (firebaseError) {
      console.log('Firebase Login Error:', firebaseError)

      const errorCode = firebaseError?.code

      const errorMessage =
        firebaseErrorMessages[errorCode] ||
        firebaseError?.message ||
        'Registration failed. Please try again.'
      // const errorCode = firebaseError?.code
      // const errorMessage = firebaseErrorMessages[errorCode] || 'Registrtion failed. Please check your details.'

      setError(errorMessage)
      setLoadingActualLogin(false)
    }
  }

  const handleJsonChange = value => {
    setPrivateKeyJson(value)

    try {
      if (value.trim()) {
        let obj = new Function('return ' + value)()

        setValue('privateKey', obj)
        setJsonError('')
      } else {
        setJsonError('Firebase JSON key is required')
      }
    } catch (err) {
      setJsonError('Invalid JSON format')
    }
  }

  // Handle Actual Login Submit

  const onSubmit = data => {
    if (!data.privateKey) return setJsonError('Firebase JSON key is required')


    // If actual login button was clicked, use the form data
    handleRegi(data, false)
  }

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className='flex justify-center items-center min-bs-[100dvh]'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className='flex bs-full justify-center overflow-hidden'>
      <div
        className={classNames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-0 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        {/* <SidebarBackground /> */}
        <LoginIllustration>
          <PhotoContainer >
            <div className=''>
              <img
                src='/images/illustrations/auth/login2.png'
                className='p-14 rounded-3xl'
                alt='login collage'
                style={{ width: '100%', height: '99dvh', objectFit: 'cover' }}
                width={100}
                height={100}
              />
            </div>

          </PhotoContainer>
        </LoginIllustration>
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper p-6 md:px-16 w-full md:is-[50dvw]'>
        <div className='flex flex-col gap-3 is-[55%]'>
          <div className='flex'>
            <img src='/images/logo/talkin-logo.png' alt={projectName || ""} className='h-20' />
          </div>
          <Typography variant='h3' className='font-bold'>
            Sign Up to your account
          </Typography>

          <Typography variant='body1' className='text-left'>
            Let&apos;s connect, chat, and spark real connections. Enter your credentials to continue your journey on {projectName}.
          </Typography>

          {/* Show Errors */}
          {error && <Alert severity='error'>{error}</Alert>}

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            {/* Email Input */}
            <div>
              <Typography variant='body2' className='mb-2 text-left'>
                Enter your email
              </Typography>
              {/* border bottom primary */}
              <CustomTextField
                fullWidth
                placeholder='Type your email here'
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{
                  '& .MuiInputBase-root': {
                    borderBottom: '2px solid',
                    borderBottomColor: theme => theme.palette.primary.main,
                    borderRadius: 0
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-mail' />
                      </InputAdornment>
                    )
                  }
                }}
              />
            </div>

            {/* Password Input */}
            <div>
              <Typography variant='body2' className='mb-2 text-left'>
                Enter your password
              </Typography>
              <CustomTextField
                fullWidth
                placeholder='Type your password here'
                type={isPasswordShown ? 'text' : 'password'}
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-password' />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                          <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
                }}
              />
            </div>
            <div>
              <Typography variant='body2' className='mb-2 text-left'>
                Enter your confirm password
              </Typography>
              <CustomTextField
                fullWidth
                placeholder='Type your confirm password here'
                type={isPasswordShown ? 'text' : 'password'}
                {...register('cpassword')}
                error={!!errors.cpassword}
                helperText={errors.cpassword?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-password' />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                          <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
                }}
              />
            </div>

            <div>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant='body2' className='mb-2 text-left'>
                  Private Key JSON
                </Typography>
                <HoverPopover
                  popoverContent={
                    <>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['privateKeyJsonLogin'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <div>{toolTipData['privateKeyJsonLogin'].tooltip}</div>
                      </Box>
                    </>
                  }
                >
                  <i className='tabler-info-circle' />
                </HoverPopover>
              </Box>

              <TextField
                value={privateKeyJson || ''}
                onChange={e => handleJsonChange(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder={'Paste your Firebase private key JSON here'}
                error={!!jsonError}
                helperText={jsonError}
                sx={{
                  '& .MuiInputBase-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  },
                  '& .MuiInputBase-inputMultiline': {
                    overflow: 'hidden',
                    resize: 'vertical'
                  }
                }}
              />
            </div>


            {/* Login Buttons */}
            <Button
              fullWidth
              variant='contained'
              type='submit'
              disabled={loadingActualLogin}
              startIcon={loadingActualLogin ? <CircularProgress size={20} /> : null}
              sx={{ bgcolor: 'primary.main', borderRadius: '8px', py: 2.5, textTransform: 'none' }}
            >
              {loadingActualLogin ? 'Signing up...' : 'Sign Up'}
            </Button>

          </form>
        </div>
      </div>
    </div>
  )
}

export default Registration
