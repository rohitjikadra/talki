'use client'

import React, { forwardRef, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Slide from '@mui/material/Slide'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import { toast } from 'react-toastify'

// Component Imports
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomAvatar from '@core/components/mui/Avatar'
import CustomIconButton from '@core/components/mui/IconButton'

// Redux Imports
import { sendSingleNotification, clearNotificationStatus } from '@/redux-store/slices/notification'

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction='up' ref={ref} {...props} />
})

const SingleNotificationDialog = ({ open, handleClose, userId, userFullName, notificationType }) => {
    const dispatch = useDispatch()
    const { loading, success, error } = useSelector(state => state.notification)

    const { profileData } = useSelector(state => state.adminSlice)


    const [formData, setFormData] = useState({
        title: '',
        message: ''
    })
    const [imageFile, setImageFile] = useState(null)
    const [previewImage, setPreviewImage] = useState(null)
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (success) {
            // toast.success('Notification sent successfully!')
            handleFormReset()
            handleClose()
            dispatch(clearNotificationStatus())
        }
        if (error) {
            toast.error(error || 'Failed to send notification')
            dispatch(clearNotificationStatus())
        }
    }, [success, error, dispatch, handleClose])

    const handleFormReset = () => {
        setFormData({
            title: '',
            message: ''
        })
        setImageFile(null)
        setPreviewImage(null)
        setErrors({})
    }

    const validate = () => {
        const newErrors = {}
        if (!formData.title) newErrors.title = 'Title is required'
        if (!formData.message) newErrors.message = 'Message is required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = e => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

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

    const handleSubmit = () => {

        if (validate()) {
            const data = new FormData()
            data.append('userId', userId)
            data.append('notificationType', notificationType)
            data.append('title', formData.title)
            data.append('message', formData.message)
            if (imageFile) {
                data.append('image', imageFile)
            }
            dispatch(sendSingleNotification(data))
        }
    }

    const onCloseDialog = () => {
        handleClose()
    }

    return (
        <Dialog
            open={open}
            onClose={onCloseDialog}
            keepMounted
            TransitionComponent={Transition}
            fullWidth
            maxWidth='sm'
            PaperProps={{
                sx: {
                    overflow: 'visible',
                    width: '600px',
                    maxWidth: '95vw',
                    borderRadius: '12px'
                }
            }}
        >
            <DialogTitle>
                <Typography variant='h5' component='span'>
                    Send Notification to {userFullName}
                </Typography>
                <DialogCloseButton onClick={onCloseDialog}>
                    <i className='tabler-x' />
                </DialogCloseButton>
            </DialogTitle>

            <DialogContent className='flex flex-col gap-5 pt-3'>
                <TextField
                    label='Title'
                    name='title'
                    fullWidth
                    value={formData.title}
                    onChange={handleChange}
                    error={!!errors.title}
                    helperText={errors.title}
                    placeholder='Enter notification title'
                />

                <TextField
                    label='Message'
                    name='message'
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    error={!!errors.message}
                    helperText={errors.message}
                    placeholder='Enter notification message'
                />

                <div className='flex flex-col gap-2'>
                    <Typography variant='subtitle1' gutterBottom>
                        Image (Optional)
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
                                        <CustomIconButton aria-label='remove image' color='error'>
                                            <i className='tabler-trash' />
                                        </CustomIconButton>
                                    </div>
                                </Box>
                            </div>
                        )}
                        {!previewImage && (
                            <>
                                <Button variant='outlined' className='w-full' component='label'>
                                    Upload Image
                                    <input type='file' accept='image/png, image/jpeg, image/jpg' hidden onChange={handleImageChange} />
                                </Button>
                                <p className='text-xs text-error mt-0.5'>Accept only .png, .jpeg and .jpg</p>
                            </>
                        )}
                    </Box>
                </div>
            </DialogContent>

            <DialogActions className='p-6 pt-0'>
                <Button variant='outlined' onClick={onCloseDialog} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    variant='contained'
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    {'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default SingleNotificationDialog
