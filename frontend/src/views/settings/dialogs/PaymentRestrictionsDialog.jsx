'use client'

import React, { forwardRef } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { Box, Divider, Slide } from '@mui/material'
import CustomAvatar from '@/@core/components/mui/Avatar'
import classNames from 'classnames'
import Link from 'next/link'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const PaymentRestrictionsDialog = ({ open, onClose }) => {
  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      keepMounted
      TransitionComponent={Transition}
      aria-labelledby='payment-restriction-dialog'
      fullWidth
      maxWidth='md'
      PaperProps={{
        sx: {
          overflow: 'visible',
          maxWidth: '500px'
        }
      }}
    >
      <DialogTitle>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent className='pb-10 px-10'>
        <CustomAvatar color='primary' skin='light' variant='tonel' size={50} sx={{ mx: 'auto' }}>
          <i className={classNames('tabler-lock', 'text-[30px]')} />
        </CustomAvatar>
        <Typography variant='h5' className='text-center' sx={{ mt: 5 }}>
          Extended License Required
        </Typography>
        <Typography variant='body1' className='text-center' sx={{ mt: 5 }}>
          If you want to charge end users by any way, you are required to purchase an Extended License as per
          CodeCanyon/Envato policy.
        </Typography>
        <Divider sx={{ my: 5 }} />

        <Typography variant='body1' className='text-center mb-4'>
          Contact us to upgrade license
        </Typography>
        <Box className='flex justify-center mt-4 flex-col items-center'>
          <Button
            variant='contained'
            color='primary'
            className='flex gap-3'
            onClick={() => window.open('https://wa.me/+919909515320', '_blank')}
          >
            <i className='tabler-message' /> +91 9909515320
          </Button>

          <Link
            href='https://codecanyon.net/licenses/faq#main-differences-licenses-a'
            target='_blank'
            className='flex items-center gap-2 mt-4 text-primary'
          >
            <Typography variant='body1' className='text-primary'>
              {' '}
              View Envato License Policy
            </Typography>
            <i className='tabler-external-link' />
          </Link>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentRestrictionsDialog

