'use client'

import React, { useState, useEffect, forwardRef, useCallback } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { debounce } from 'lodash'

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  CircularProgress,
  Autocomplete,
  Typography,
  Grid,
  InputAdornment,
  Slide,
  FormHelperText
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'

import { useForm, Controller } from 'react-hook-form'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { createCoinTrader, updateCoinTrader, updateCoinForTrader, fetchUserList } from '@/redux-store/slices/coinTrader'
import CustomAvatar from '@core/components/mui/Avatar'
import { toast } from 'react-toastify'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { getInitials } from '@/utils/getInitials'
import { fetchUsers, updateCoinForUser } from '@/redux-store/slices/user'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const CoinUserDialog = ({ open, onClose, editData, coinAdjustmentMode = false }) => {
  const dispatch = useDispatch()
  const { profileData } = useSelector(state => state.adminSlice)


  const { status, user, loading } = useSelector(state => state.userReducer)

  const [userSearchQuery, setUserSearchQuery] = useState('')

  const isEditMode = Boolean(editData)
  const isCoinAdjustmentMode = Boolean(coinAdjustmentMode && editData)

  const { settings } = useSelector(state => state.settings)

  // Form validation
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      userId: '',
      coin: '',
      coinAction: 'add'
    }
  })

  const coinAction = watch('coinAction')
  const debouncedFetchUsers = useCallback(
    debounce(searchQuery => {
      dispatch(fetchUserList({ search: searchQuery }))
    }, 500),
    [dispatch]
  )

  // Load user list for selection
  useEffect(() => {
    if (open && !isEditMode) {
      debouncedFetchUsers(userSearchQuery)
    }
  }, [open, isEditMode, userSearchQuery, debouncedFetchUsers])

  // Set form values when editing
  useEffect(() => {
    if (open) {
      if (editData) {
        if (isCoinAdjustmentMode) {
          setValue('coinAmount', '')
          setValue('coinAction', 'add')
        } else {
          setValue('mobileNumber', editData.mobileNumber || '')
          setValue('countryCode', editData.countryCode || '')
        }
      } else {
        // Reset form when dialog opens in create mode
        reset({
          userId: '',
          coin: '',
          coinAction: 'add'
        })
      }
    }
  }, [open, editData, isCoinAdjustmentMode, setValue, reset])

  // Handle form submission
  const onSubmit = async data => {


    try {
      if (isCoinAdjustmentMode) {
        // Update coins
        const successFull = await dispatch(
          updateCoinForUser({
            userId: editData._id,
            coin: parseInt(data.coinAmount),
            action: data.coinAction
          })
        ).unwrap()

        if (successFull) {
          // yahan pe apni current listing ke hisaab se params pass karo
          await dispatch(
            fetchUsers({
              page: 1,
              pageSize: 10,
              searchQuery: '',
              startDate: 'All',
              endDate: 'All'
            })
          )
        }
      }
      onClose()
    } catch (error) {
      onClose()
      console.error('Error:', error)
    }
  }

  // Render the appropriate title based on mode
  const getDialogTitle = () => {
    if (isCoinAdjustmentMode) {
      return `Adjust Coins for ${editData?.fullName || 'User'}`
    } else if (isEditMode) {
      return `Edit ${editData?.fullName || 'User'}`
    } else {
      return 'Create Coin User'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      keepMounted
      TransitionComponent={Transition}
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
          {getDialogTitle()}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <CloseIcon />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3} sx={{ mt: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Coin adjustment fields - only show in coin adjustment mode */}
            {isCoinAdjustmentMode && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      Current Coin Balance :
                      <img
                        src="/images/tcoin.png"
                        alt="coin"
                        style={{ width: 18, height: 18 }}
                      />
                      <span style={{ color: 'primary.main' }}>
                        {editData?.coins || 0}
                      </span>
                    </Typography>

                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name='coinAction'
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <Button
                          variant={field.value === 'add' ? 'contained' : 'outlined'}
                          color='primary'
                          onClick={() => field.onChange('add')}
                          sx={{ mr: 2 }}
                        >
                          Add Coins
                        </Button>
                        <Button
                          variant={field.value === 'deduct' ? 'contained' : 'outlined'}
                          color='error'
                          onClick={() => field.onChange('deduct')}
                        >
                          Remove Coins
                        </Button>
                      </Box>
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name='coinAmount'
                    control={control}
                    rules={{
                      required: 'Coin amount is required',
                      min: {
                        value: 1,
                        message: 'Coin amount must be at least 1'
                      },
                      validate: value => {
                        if (coinAction === 'deduct' && parseInt(value) > (editData?.coins || 0)) {
                          return 'Not enough coins to deduct the requested coins'
                        }

                        return true
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type='number'
                        label={coinAction === 'add' ? 'Coins to Add' : 'Coins to Remove'}
                        fullWidth
                        error={Boolean(errors.coinAmount)}
                        helperText={errors.coinAmount?.message}
                        InputProps={{
                          startAdornment: (
                            // <InputAdornment position='start'>{settings?.currency?.symbol || '$'}</InputAdornment>
                            <CustomAvatar skin='light' color='secondary' size='xs' sx={{ width: 22, height: 22 }}>
                              <i className='tabler-coins' ></i>
                            </CustomAvatar>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant='outlined' onClick={onClose} sx={{ mr: 2 }}>
                Cancel
              </Button>
              <Button type='submit' variant='contained' disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {isCoinAdjustmentMode ? 'Updating...' : isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : isCoinAdjustmentMode ? (
                  'Update Coins'
                ) : isEditMode ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// export default CoinUserDialog
export default CoinUserDialog
