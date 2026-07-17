'use client'

import React, { useEffect, useRef, useState } from 'react'

import { useSelector, useDispatch } from 'react-redux'

import axios from 'axios'

// MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { toast } from 'react-toastify'

import { Divider } from '@mui/material'

// Redux Actions
import { updateSettings, toggleSetting } from '@/redux-store/slices/settings'
import HoverPopover from '@/common/HoverPopover'
import { toolTipData } from '@/settingTooltip'
import { baseURL, secretKey } from '@/config'
import PaymentRestrictionsDialog from '@/views/settings/dialogs/PaymentRestrictionsDialog'

const PaymentSettings = () => {
  const dispatch = useDispatch()
  const [initialData, setInitialData] = useState({})
  const { settings, loading } = useSelector(state => state.settings)
  const { profileData } = useSelector(state => state.adminSlice)



  const [isCheckedOnce, setIsCheckedOnce] = useState(false)
  const [isPaymentAllowed, setIsPaymentAllowed] = useState(null)
  const [isPaymentRestrictionDialogOpen, setIsPaymentRestrictionDialogOpen] = useState(false)
  const paymentCheckPromiseRef = useRef(null)

  // Using string values for inputs to allow empty fields
  const [formData, setFormData] = useState({
    _id: '',
    stripePublicKey: '',
    stripeSecretKey: '',
    razorpayKeyId: '',
    paystackPublicKey: '',
    razorpayKeySecret: '',
    paystackSecretKey: '',
    flutterwavePublicKey: '',
    isStripeEnabled: false,
    isRazorpayEnabled: false,
    isPaystackAndroidEnabled: false,
    isPaystackIosEnabled: false,
    isFlutterwaveEnabled: false,
    isGooglePlayEnabled: false,
    // ✅ NEW – iOS toggles
    isGooglePlayIosEnabled: false,
    isStripeIosEnabled: false,
    isRazorpayIosEnabled: false,
    isFlutterwaveIosEnabled: false,

    // ✅ NEW – Cashfree
    isCashfreeAndroidEnabled: false,
    isCashfreeIosEnabled: false,
    cashfreeClientId: '',
    cashfreeClientSecret: '',

    // ✅ NEW – PayPal
    isPaypalAndroidEnabled: false,
    isPaypalIosEnabled: false,
    paypalClientId: '',
    paypalSecretKey: ''
  })

  useEffect(() => {
    if (settings) {
      const newData = {
        _id: settings._id || '',
        stripePublicKey: settings.stripePublicKey || '',
        stripeSecretKey: settings.stripeSecretKey || '',
        razorpayKeyId: settings.razorpayKeyId || '',
        paystackPublicKey: settings.paystackPublicKey || '',
        razorpayKeySecret: settings.razorpayKeySecret || '',
        paystackSecretKey: settings.paystackSecretKey || '',
        flutterwavePublicKey: settings.flutterwavePublicKey || '',
        isStripeEnabled: settings.isStripeEnabled || false,
        isRazorpayEnabled: settings.isRazorpayEnabled || false,
        isPaystackAndroidEnabled: settings.isPaystackAndroidEnabled || false,
        isPaystackIosEnabled: settings.isPaystackIosEnabled || false,
        isFlutterwaveEnabled: settings.isFlutterwaveEnabled || false,
        isGooglePlayEnabled: settings.isGooglePlayEnabled || false,
        // ✅ iOS toggles
        isGooglePlayIosEnabled: settings.isGooglePlayIosEnabled || false,
        isStripeIosEnabled: settings.isStripeIosEnabled || false,
        isRazorpayIosEnabled: settings.isRazorpayIosEnabled || false,
        isFlutterwaveIosEnabled: settings.isFlutterwaveIosEnabled || false,
        // ✅ Cashfree
        isCashfreeAndroidEnabled: settings.isCashfreeAndroidEnabled || false,
        isCashfreeIosEnabled: settings.isCashfreeIosEnabled || false,
        cashfreeClientId: settings.cashfreeClientId || '',
        cashfreeClientSecret: settings.cashfreeClientSecret || '',

        // ✅ PayPal
        isPaypalAndroidEnabled: settings.isPaypalAndroidEnabled || false,
        isPaypalIosEnabled: settings.isPaypalIosEnabled || false,
        paypalClientId: settings.paypalClientId || '',
        paypalSecretKey: settings.paypalSecretKey || ''
      }

      setFormData(newData)
      setInitialData(newData) // store original data
    }

    
  }, [settings])

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {}

    const token = localStorage.getItem('admin_token')
    const uid = localStorage.getItem('uid')

    return {
      'Content-Type': 'application/json',
      key: secretKey,
      Authorization: `Bearer ${token}`,
      'x-admin-uid': uid
    }
  }

  const checkPaymentSettingPermissionOnce = async () => {
    

    if (isCheckedOnce) return isPaymentAllowed === true;

    if (paymentCheckPromiseRef.current) return paymentCheckPromiseRef.current;

    try {
      const promise = (async () => {
        const response = await axios.get(
          `${baseURL}/api/admin/setting/verifyPurchaseCode`,
          { headers: getAuthHeaders() }
        );

        const allowed =
          response?.data?.status === true &&
          response?.data?.allowPaymentSettings === true;

        setIsCheckedOnce(true);
        setIsPaymentAllowed(allowed);

        return allowed;
      })();

      paymentCheckPromiseRef.current = promise;

      return await promise;
    } catch (error) {
      // Fail closed: if validation cannot be performed, treat as restricted.
      setIsCheckedOnce(true);
      setIsPaymentAllowed(false);

      return false;
    } finally {
      paymentCheckPromiseRef.current = null;
    }
  };

  const handleToggle = async type => {


    if (isCheckedOnce) {
      if (isPaymentAllowed !== true) {
        setIsPaymentRestrictionDialogOpen(true)
        return
      }
    } else {
      const allowed = await checkPaymentSettingPermissionOnce()

      if (!allowed) {
        setIsPaymentRestrictionDialogOpen(true)
        return
      }
    }

    if (settings?._id) {
      dispatch(toggleSetting({ settingId: settings._id, type }))

      // Update local state too
      setFormData(prev => ({
        ...prev,
        [type]: !prev[type]
      }))
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getUpdatedFields = () => {
    const updates = {}

    Object.keys(formData).forEach(key => {
      if (formData[key] !== initialData[key]) {
        updates[key] = formData[key]
      }
    })

    return updates
  }

  const handleSubmit = () => {
    

    // if (settings?._id) {
    //   dispatch(updateSettings(formData))
    // }

    if (settings?._id) {
      const updatedFields = getUpdatedFields()

      if (Object.keys(updatedFields).length === 0) {
        return
      }

      dispatch(updateSettings({ _id: settings._id, ...updatedFields }))
    }
  }

  // if (!settings) return null

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant='h4'>Payment Setting</Typography>
          <Typography variant='body2' color='text.secondary'>
            Configure and manage payment gateway integrations and platform billing credentials.
          </Typography>
        </Box>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmit}
          disabled={loading || Object.keys(getUpdatedFields()).length === 0}
          startIcon={
            loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <i className='tabler-device-floppy' />
          }
        >
          Save Changes
        </Button>
      </Box>

      <Grid container spacing={6}>
        {/* Stripe Settings */}
        <Grid item size={12}>
          <Card>
            <CardContent>
              {/* <Box sx={{ mb: 4 }}>
                <Typography variant='h6'>Stripe Setting</Typography>
              </Box> */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  <i className='tabler-settings mr-2' />
                  Stripe Setting
                </Typography>
                <HoverPopover
                  popoverContent={
                    <>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isStripeEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isStripeEnabled'].tooltip}</p>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isStripeIosEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isStripeIosEnabled'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['stripePublicKey'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['stripePublicKey'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['stripeSecretKey'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['stripeSecretKey'].tooltip}</p>
                      </Box>
                    </>
                  }
                >
                  <i className='tabler-info-circle' />
                </HoverPopover>
              </Box>
              <Box sx={{ mt: 1, mb: 4 }}>
                <Grid
                  container
                  spacing={2}
                  sx={{
                    width: '100%',
                    ml: 0
                  }}
                >
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isStripeEnabled}
                          onChange={() => handleToggle('isStripeEnabled')}
                          name='stripeEnabled'
                        />
                      }
                      label='Enable Stripe (Android) (Enable/Disable)'
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isStripeIosEnabled}
                          onChange={() => handleToggle('isStripeIosEnabled')}
                          name='isStripeIosEnabled'
                        />
                      }
                      label='Enable Stripe (IOS) (Enable/Disable)'
                    />
                  </Grid>
                </Grid>
              </Box>
              <Grid container spacing={4}>
                <Grid item size={6}>
                  <TextField
                    fullWidth
                    label='Stripe Publishable Key'
                    value={formData.stripePublicKey || ''}
                    onChange={e => handleInputChange('stripePublicKey', e.target.value)}
                  />
                </Grid>
                <Grid item size={6}>
                  <TextField
                    fullWidth
                    label='Stripe Secret Key'
                    value={formData.stripeSecretKey || ''}
                    onChange={e => handleInputChange('stripeSecretKey', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Razorpay Settings */}
        <Grid item size={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  <i className='tabler-settings mr-2' />
                  Razorpay Setting
                </Typography>
                <HoverPopover
                  popoverContent={
                    <>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isRazorpayEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isRazorpayEnabled'].tooltip}</p>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isRazorpayIosEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isRazorpayIosEnabled'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['razorpayKeyId'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['razorpayKeyId'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['razorpayKeySecret'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['razorpayKeySecret'].tooltip}</p>
                      </Box>
                    </>
                  }
                >
                  <i className='tabler-info-circle' />
                </HoverPopover>
              </Box>
              <Box sx={{ mt: 1, mb: 4 }}>
                <Grid container spacing={2} sx={{ width: '100%', ml: 0 }}>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isRazorpayEnabled}
                          onChange={() => handleToggle('isRazorpayEnabled')}
                          name='razorpayEnabled'
                        />
                      }
                      label='Enable Razorpay (Android) (Enable/Disable)'
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isRazorpayIosEnabled}
                          onChange={() => handleToggle('isRazorpayIosEnabled')}
                          name='isRazorpayIosEnabled'
                        />
                      }
                      label='Enable Razorpay (IOS) (Enable/Disable)'
                    />
                  </Grid>
                </Grid>
              </Box>
              <Grid container spacing={4}>
                <Grid item size={6}>
                  <TextField
                    fullWidth
                    label='Razorpay ID'
                    value={formData.razorpayKeyId || ''}
                    onChange={e => handleInputChange('razorpayKeyId', e.target.value)}
                  />
                </Grid>
                <Grid item size={6}>
                  <TextField
                    fullWidth
                    label='Razorpay Secret Key'
                    value={formData.razorpayKeySecret || ''}
                    onChange={e => handleInputChange('razorpayKeySecret', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Flutterwave Settings */}
        <Grid item size={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  <i className='tabler-settings mr-2' />
                  Flutter wave Setting
                </Typography>
                <HoverPopover
                  popoverContent={
                    <>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isFlutterwaveEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isFlutterwaveEnabled'].tooltip}</p>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isFlutterwaveEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isFlutterwaveEnabled'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isFlutterwaveIosEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isFlutterwaveIosEnabled'].tooltip}</p>
                      </Box>
                    </>
                  }
                >
                  <i className='tabler-info-circle' />
                </HoverPopover>
              </Box>
              <Box sx={{ mt: 1, mb: 4 }}>
                <Grid container spacing={2} sx={{ width: '100%', ml: 0 }}>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isFlutterwaveEnabled}
                          onChange={() => handleToggle('isFlutterwaveEnabled')}
                          name='flutterwaveEnabled'
                        />
                      }
                      label='Enable Flutterwave (Android) (Enable/Disable) '
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isFlutterwaveIosEnabled}
                          onChange={() => handleToggle('isFlutterwaveIosEnabled')}
                          name='isFlutterwaveIosEnabled'
                        />
                      }
                      label='Enable Flutterwave (IOS) (Enable/Disable)'
                    />
                  </Grid>
                </Grid>
              </Box>
              <Grid container spacing={4}>
                <Grid item size={12}>
                  <TextField
                    fullWidth
                    label='Flutterwave ID'
                    value={formData.flutterwavePublicKey || ''}
                    onChange={e => handleInputChange('flutterwavePublicKey', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Paystack Settings */}
        <Grid item size={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  <i className='tabler-settings mr-2' />
                  Paystack Setting
                </Typography>
                <HoverPopover
                  popoverContent={
                    <>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isPaystackAndroidEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isPaystackAndroidEnabled'].tooltip}</p>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isPaystackIosEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isPaystackIosEnabled'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['paystackPublicKey'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['paystackPublicKey'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['paystackSecretKey'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['paystackSecretKey'].tooltip}</p>
                      </Box>
                    </>
                  }
                >
                  <i className='tabler-info-circle' />
                </HoverPopover>
              </Box>
              <Box sx={{ mt: 1, mb: 4 }}>
                <Grid container spacing={2} sx={{ width: '100%', ml: 0 }}>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isPaystackAndroidEnabled}
                          onChange={() => handleToggle('isPaystackAndroidEnabled')}
                          name='isPaystackAndroidEnabled'
                        />
                      }
                      label='Enable Paystack (Android) (Enable/Disable)'
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isPaystackIosEnabled}
                          onChange={() => handleToggle('isPaystackIosEnabled')}
                          name='isPaystackIosEnabled'
                        />
                      }
                      label='Enable Paystack (IOS) (Enable/Disable)'
                    />
                  </Grid>
                </Grid>
              </Box>
              <Grid container spacing={4}>
                <Grid item size={6}>
                  <TextField
                    fullWidth
                    label='Paystack Public Key'
                    value={formData.paystackPublicKey || ''}
                    onChange={e => handleInputChange('paystackPublicKey', e.target.value)}
                  />
                </Grid>
                <Grid item size={6}>
                  <TextField
                    fullWidth
                    label='Paystack Secret Key'
                    value={formData.paystackSecretKey || ''}
                    onChange={e => handleInputChange('paystackSecretKey', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Cashfree Settings */}
        <Grid item size={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  <i className='tabler-settings mr-2' />
                  Cashfree Setting
                </Typography>
                <HoverPopover
                  popoverContent={
                    <>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isCashfreeAndroidEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isCashfreeAndroidEnabled'].tooltip}</p>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isCashfreeIosEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isCashfreeIosEnabled'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['cashfreeClientId'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['cashfreeClientId'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['cashfreeClientSecret'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['cashfreeClientSecret'].tooltip}</p>
                      </Box>
                    </>
                  }
                >
                  <i className='tabler-info-circle' />
                </HoverPopover>
              </Box>

              <Box sx={{ mt: 1, mb: 4 }}>
                <Grid container spacing={2} sx={{ width: '100%', ml: 0 }}>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isCashfreeAndroidEnabled}
                          onChange={() => handleToggle('isCashfreeAndroidEnabled')}
                        />
                      }
                      label='Enable Cashfree (Android) (Enable/Disable)'
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isCashfreeIosEnabled}
                          onChange={() => handleToggle('isCashfreeIosEnabled')}
                        />
                      }
                      label='Enable Cashfree (IOS) (Enable/Disable)'
                    />
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={4}>
                <Grid item size={6}>
                  <TextField
                    fullWidth
                    label='Cashfree Client ID'
                    value={formData.cashfreeClientId}
                    onChange={e => handleInputChange('cashfreeClientId', e.target.value)}
                  />
                </Grid>
                <Grid item size={6}>
                  <TextField
                    fullWidth
                    label='Cashfree Client Secret'
                    value={formData.cashfreeClientSecret}
                    onChange={e => handleInputChange('cashfreeClientSecret', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* PayPal Settings */}
        <Grid item size={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  <i className='tabler-settings mr-2' />
                  PayPal Setting
                </Typography>
                <HoverPopover
                  popoverContent={
                    <>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isPaypalAndroidEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isPaypalAndroidEnabled'].tooltip}</p>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['isPaypalIosEnabled'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['isPaypalIosEnabled'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['paypalClientId'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['paypalClientId'].tooltip}</p>
                      </Box>
                      <Box className='mt-2'>
                        <Typography
                          variant='subtitle1'
                          sx={{ marginBottom: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                        >
                          {toolTipData['paypalSecretKey'].title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData['paypalSecretKey'].tooltip}</p>
                      </Box>
                    </>
                  }
                >
                  <i className='tabler-info-circle' />
                </HoverPopover>
              </Box>

              <Box sx={{ mt: 1, mb: 4 }}>
                <Grid container spacing={2} sx={{ width: '100%', ml: 0 }}>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isPaypalAndroidEnabled}
                          onChange={() => handleToggle('isPaypalAndroidEnabled')}
                        />
                      }
                      label='Enable PayPal (Android) (Enable/Disable)'
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isPaypalIosEnabled}
                          onChange={() => handleToggle('isPaypalIosEnabled')}
                        />
                      }
                      label='Enable PayPal (IOS) (Enable/Disable)'
                    />
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={4}>
                <Grid item size={6}>
                  <TextField
                    fullWidth
                    label='PayPal Client ID'
                    value={formData.paypalClientId}
                    onChange={e => handleInputChange('paypalClientId', e.target.value)}
                  />
                </Grid>
                <Grid item size={6}>
                  <TextField
                    fullWidth
                    label='PayPal Secret Key'
                    value={formData.paypalSecretKey}
                    onChange={e => handleInputChange('paypalSecretKey', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Google Play Settings */}
        <Grid item size={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant='subtitle1'
                  sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}
                >
                  <i className='tabler-settings mr-2' />
                  Google Play Setting
                </Typography>

                <HoverPopover
                  popoverContent={
                    <>
                      {/* Google Play Android */}
                      <Box>
                        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 500 }}>
                          {toolTipData.isGooglePlayEnabled.title}
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>{toolTipData.isGooglePlayEnabled.tooltip}</p>
                      </Box>

                      {/* Google Play iOS */}
                      <Box className='mt-2'>
                        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 500 }}>
                          Enable Google Play iOS
                        </Typography>
                        <Divider sx={{ mb: 0 }} />
                        <p>Toggle to enable or disable Google Play for iOS platform.</p>
                      </Box>

                    </>
                  }
                >
                  <i className='tabler-info-circle' />
                </HoverPopover>
              </Box>

              <Box sx={{ mt: 1, mb: 0 }}>
                <Grid container spacing={2} sx={{ width: '100%', ml: 0 }}>
                  {/* Google Play Android */}
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isGooglePlayEnabled}
                          onChange={() => handleToggle('isGooglePlayEnabled')}
                        />
                      }
                      label='Enable Google Play (Android) (Enable/Disable)'
                    />
                  </Grid>

                  {/* Google Play iOS */}
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      sx={{ justifyContent: 'flex-start', width: '100%', m: 0 }}
                      control={
                        <Switch
                          checked={formData.isGooglePlayIosEnabled}
                          onChange={() => handleToggle('isGooglePlayIosEnabled')}
                        />
                      }
                      label='Enable Google Play (IOS) (Enable/Disable)'
                    />
                  </Grid>
                </Grid>
              </Box>



            </CardContent>
          </Card>
        </Grid>


      </Grid>

      <PaymentRestrictionsDialog
        open={isPaymentRestrictionDialogOpen}
        onClose={() => setIsPaymentRestrictionDialogOpen(false)}
      />

      {/* <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <i className='tabler-device-floppy' />}
        >
          Save Changes
        </Button>
      </Box> */}
    </Box>
  )
}

export default PaymentSettings
