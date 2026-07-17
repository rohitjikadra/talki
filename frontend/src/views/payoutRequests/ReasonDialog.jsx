import React, { forwardRef, useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Slide,
  Typography,
  CircularProgress,
  Divider,
  Box
} from '@mui/material'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const ReasonDialog = ({ open, onClose, onSubmit, loading, reason }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      keepMounted
      TransitionComponent={Transition}
      fullWidth
      maxWidth='sm'
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '600px',
          maxWidth: '95vw',
          borderRadius: 2
        }
      }}
    >
      {/* ===== Title ===== */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1
        }}
      >
        <Typography variant='h5' fontWeight={600}>
          Reject Reason
        </Typography>

        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      {/* ===== Divider below title ===== */}
      <Divider />

      {/* ===== Content ===== */}
      <DialogContent sx={{ pt: 3 }}>
        <Box
          sx={{
            backgroundColor: theme => theme.palette.action.hover,
            borderRadius: 1.5,
            padding: 2
          }}
        >
          <Typography
            variant='body1'
            color={reason ? 'text.primary' : 'text.secondary'}
          >
            {reason?.trim()
              ? reason
              : 'No reject reason has been provided for this payout request.'
            }
          </Typography>
        </Box>
      </DialogContent>

      {/* ===== Actions ===== */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant='tonal' color='primary'>
          Close
        </Button>
      </DialogActions>
    </Dialog>

  )
}

export default ReasonDialog
