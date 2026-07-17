'use client'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

import { secretKey, baseURL } from '@/config'

const BASE_URL = baseURL

// Helper to get auth headers
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

// Fetch coin plan history
export const fetchCoinPlanHistory = createAsyncThunk(
  'coinPlanHistory/fetchCoinPlanHistory',
  async ({ page = 1, limit = 10, startDate = 'All', endDate = 'All', search = '', paymentGateway = 'All' }, thunkAPI) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/admin/coinplan/getCoinPurchaseHistory?start=${page}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&search=${search}&paymentGateway=${paymentGateway}`,
        {
          headers: getAuthHeaders()
        }
      )

      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchCoinPurchaseHistory = createAsyncThunk(
  'user/fetchCoinPurchaseHistory',
  async ({ userId, start = 1, limit = 20, startDate = 'All', endDate = 'All', search = '' }, thunkAPI) => {
    try {
      // If we have date filters, always start from page 1 to avoid pagination issues
      const effectiveStart = startDate !== 'All' || endDate !== 'All' ? 1 : start

      const res = await axios.get(`${baseURL}/api/admin/history/retrievePurchaseLog`, {
        headers: getAuthHeaders(),
        params: { userId, start: start, limit, startDate, endDate, search }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialState = {
  loading: false,
  history: [],
  adminEarnings: 0,
  status: 'idle',
  error: null,
  page: 1,
  pageSize: 10,
  total: 0,
  searchQuery: '',
  paymentGateway: 'All',
  dateRange: {
    startDate: 'All',
    endDate: 'All'
  },
  coinhistory: {
    data: [],
    loading: false,
    initialLoading: true,
    error: null,
    page: 1,
    pageSize: 20,
    total: 0,
    searchQuery: '',
    paymentGateway: 'All',
    dateRange: {
      startDate: 'All',
      endDate: 'All'
    }
  }
}

const coinPlanHistorySlice = createSlice({
  name: 'coinPlanHistory',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
      state.page = 1 // Reset to first page when changing page size
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload
      state.page = 1 // Reset to first page when changing date range
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
      state.page = 1 // Reset to first page when changing search query
    },
    setPaymentGateway: (state, action) => {
      state.paymentGateway = action.payload
      state.page = 1 // Reset to first page when changing payment gateway
    }
  },
  extraReducers: builder => {
    // Fetch coin plan history
    builder.addCase(fetchCoinPlanHistory.pending, state => {
      state.loading = true
    })
    builder.addCase(fetchCoinPlanHistory.fulfilled, (state, action) => {
      state.loading = false

      if (action.payload.status) {
        state.history = action.payload.data
        state.total = action.payload.total || 0
        state.adminEarnings = action.payload.adminEarnings || 0
      } else {
        state.error = action.payload.message
        toast.error(action.payload.message)
      }
    })
    builder.addCase(fetchCoinPlanHistory.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
      toast.error(action.payload)
    })
      // Purchase History
      .addCase(fetchCoinPurchaseHistory.pending, state => {
        state.coinhistory.loading = true
      })
      .addCase(fetchCoinPurchaseHistory.fulfilled, (state, action) => {
        const { data, total } = action.payload

        state.coinhistory.data = data
        state.coinhistory.total = total
        state.coinhistory.loading = false
        state.coinhistory.initialLoading = false

        // state.history.hasMore = uniqueNewData.length > 0 && state.history.data.length < total
        state.coinhistory.page = 1
      })
      .addCase(fetchCoinPurchaseHistory.rejected, (state, action) => {
        state.coinhistory.loading = false
        state.coinhistory.initialLoading = false
        state.coinhistory.error = action.payload
      })
  }
})

export const { setPage, setPageSize, setDateRange, setSearchQuery, setPaymentGateway } = coinPlanHistorySlice.actions

export default coinPlanHistorySlice.reducer
