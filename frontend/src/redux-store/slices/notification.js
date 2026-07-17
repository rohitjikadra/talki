'use client'

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { secretKey, baseURL } from '@/config'

const getAuthHeaders = () => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('admin_token')
        const uid = localStorage.getItem('uid')

        return {
            'Content-Type': 'application/json',
            key: secretKey,
            Authorization: `Bearer ${token}`,
            'x-admin-uid': uid
        }
    }

    return {}
}

export const sendNotifications = createAsyncThunk(
    'api/admin/notification/sendNotifications',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${baseURL}/api/admin/notification/sendNotifications`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            })

            return response.data
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Notification sending failed'

            return rejectWithValue(errorMessage)
        }
    }
)

export const sendSingleNotification = createAsyncThunk(
    'api/admin/notification/sendSingleNotification',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${baseURL}/api/admin/notification/sendSingleNotification`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            })

            return response.data
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Single notification sending failed'

            return rejectWithValue(errorMessage)
        }
    }
)

const notificationSlice = createSlice({
    name: 'notification',
    initialState: {
        loading: false,
        success: false,
        error: null
    },
    reducers: {
        clearNotificationStatus: state => {
            state.loading = false
            state.success = false
            state.error = null
        }
    },
    extraReducers: builder => {
        builder
            .addCase(sendNotifications.pending, state => {
                state.loading = true
                state.success = false
                state.error = null
            })
            .addCase(sendNotifications.fulfilled, (state, action) => {
                state.loading = false
                state.success = true
                state.error = null
            })
            .addCase(sendNotifications.rejected, (state, action) => {
                state.loading = false
                state.success = false
                state.error = action.payload
            })
            .addCase(sendSingleNotification.pending, state => {
                state.loading = true
                state.success = false
                state.error = null
            })
            .addCase(sendSingleNotification.fulfilled, (state, action) => {
                state.loading = false
                state.success = true
                state.error = null
            })
            .addCase(sendSingleNotification.rejected, (state, action) => {
                state.loading = false
                state.success = false
                state.error = action.payload
            })
    }
})

export const { clearNotificationStatus } = notificationSlice.actions

export default notificationSlice.reducer
