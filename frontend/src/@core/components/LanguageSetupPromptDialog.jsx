'use client'

import { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { usePathname, useRouter } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import { fetchLanguages } from '@/redux-store/slices/languages'

const LanguageSetupPromptDialog = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const total = useSelector(state => state.languages.total)
  const initialLoading = useSelector(state => state.languages.initialLoading)

  useEffect(() => {
    dispatch(fetchLanguages({ page: 1, pageSize: 1 }))
  }, [pathname, dispatch])

  useEffect(() => {
    if (initialLoading) return

    const onLanguagesPage = pathname === '/languages'

    if (total > 0 || onLanguagesPage) {
      setOpen(false)
    } else if (total === 0) {
      setOpen(true)
    }
  }, [initialLoading, total, pathname])

  const handleGoToLanguages = () => {
    router.push('/languages')
  }

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      disableEscapeKeyDown
      aria-labelledby='language-setup-dialog-title'
      maxWidth='sm'
      fullWidth
    >
      <DialogTitle id='language-setup-dialog-title'>Add an app language</DialogTitle>
      <DialogContent>
        <Typography variant='body1' color='text.secondary'>
          Your project does not have any app languages yet. Open App Languages and add at least one language so the app
          can display localized content correctly.
        </Typography>
      </DialogContent>
      <DialogActions className='gap-2 pbs-2'>
        <Button variant='contained' onClick={handleGoToLanguages} startIcon={<i className='tabler-language' />}>
          Go to App Languages
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LanguageSetupPromptDialog
