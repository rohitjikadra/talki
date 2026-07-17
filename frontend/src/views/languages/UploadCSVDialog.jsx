'use client'

import { forwardRef, useRef, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Slide from '@mui/material/Slide'
import Typography from '@mui/material/Typography'
import { toast } from 'react-toastify'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { uploadTranslationsCSV } from '@/redux-store/slices/languages'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

/**
 * UploadCSVDialog
 * @param {boolean}  open
 * @param {function} onClose
 * @param {Array}    activeLanguages  – filtered list from main page
 */
const UploadCSVDialog = ({ open, onClose, activeLanguages = [] }) => {
  const dispatch = useDispatch()
  const { uploadLoading } = useSelector(state => state.languages)
  const { profileData } = useSelector(state => state.adminSlice)


  const [csvFile, setCsvFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = e => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a valid CSV file')

      return
    }

    setCsvFile(file)
  }

  const handleClose = () => {
    if (uploadLoading) return
    setCsvFile(null)

    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  const handleSubmit = async () => {


    if (!csvFile) {
      toast.error('Please select a CSV file first')

      return
    }

    await dispatch(uploadTranslationsCSV(csvFile))
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
      aria-labelledby='upload-csv-dialog-title'
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '600px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle id='upload-csv-dialog-title' sx={{ p: 4, pb: 2 }}>
        <Typography variant='h5' component='span'>
          Upload CSV File
        </Typography>
        <DialogCloseButton onClick={handleClose} disabled={uploadLoading}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='flex flex-col gap-4 py-4' sx={{ overflowX: 'hidden' }}>
        {/* Active language count description */}
        <Typography variant='body2' color='text.secondary'>
          You currently have{' '}
          <Typography component='span' fontWeight={600} color='text.primary'>
            {activeLanguages.length}
          </Typography>{' '}
          active language{activeLanguages.length !== 1 ? 's' : ''}. Please upload a CSV file that includes all these
          languages.
        </Typography>

        {/* Scrollable language list */}
        <Box
          className='border rounded overflow-y-auto'
          sx={{ maxHeight: 220 }}
        >
          <List dense disablePadding>
            {activeLanguages.map((lang, idx) => (
              <Box key={lang.languageCode}>
                <ListItem>
                  <ListItemText
                    primary={`${lang.languageTitle} (${lang.languageCode})`}
                  />
                </ListItem>
                {idx < activeLanguages.length - 1 && <Divider />}
              </Box>
            ))}
            {activeLanguages.length === 0 && (
              <ListItem>
                <ListItemText primary='No active languages found' />
              </ListItem>
            )}
          </List>
        </Box>

        {/* Note alert */}
        <Alert severity='warning' variant='outlined'>
          <Typography variant='body2'>
            <strong>Note: </strong> The language code must exist inside the CSV file being uploaded.
          </Typography>
        </Alert>

        {/* File upload button */}
        <Box>
          <Button
            variant='outlined'
            component='label'
            fullWidth
            startIcon={<i className='tabler-upload' />}
          >
            {csvFile ? csvFile.name : 'Upload File'}
            <input
              ref={fileInputRef}
              type='file'
              accept='.csv'
              hidden
              onChange={handleFileChange}
            />
          </Button>
          <Typography variant='caption' color='text.secondary' className='mt-1 block'>
            Accepted formats: .csv
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 0 }}>
        <Button onClick={handleClose} variant='outlined' color='secondary' disabled={uploadLoading}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={uploadLoading || !csvFile}
          startIcon={uploadLoading ? <CircularProgress size={18} /> : null}
        >
          {uploadLoading ? 'Uploading...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UploadCSVDialog
