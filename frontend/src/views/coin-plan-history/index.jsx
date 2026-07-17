'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { IconButton } from '@mui/material'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

// MUI Imports
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import { Fab, Tooltip } from '@mui/material'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomTextField from '@/@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'
import { formatDateTime } from '@/utils/format'

// Redux Actions
import {
  fetchCoinPlanHistory,
  setDateRange,
  setPage,
  setPageSize,
  setSearchQuery,
  setPaymentGateway
} from '@/redux-store/slices/coinPlanHistory'

// Helper Functions
import CustomAvatar from '@/@core/components/mui/Avatar'
import { getFullImageUrl } from '@/utils/commonfunctions'

import { getInitials } from '@/utils/getInitials'

// import { useRouter } from 'next/router'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import DateRangePicker from '@/components/common/DateRangePicker'
import EmprtyTableRow from '@/components/common/EmprtyTableRow'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import { fetchDefaultCurrencies } from '@/redux-store/slices/currency'
import Link from 'next/link'
import { Visibility } from '@mui/icons-material'

const columnHelper = createColumnHelper()

export const handleCopy = async text => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const DebouncedInput = ({ value: initialValue, updateUrlPagination, resetSignal, ...props }) => {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const hasUserInteracted = useRef(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()

  // Handle debounced value changes
  useEffect(() => {
    if (!hasUserInteracted.current) return

    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, 500) // 500ms debounce delay for typing

    return () => clearTimeout(handler)
  }, [value])

  // Handle URL and Redux updates once debounced value settles
  useEffect(() => {
    if (!hasUserInteracted.current) return

    // Update Redux state with empty string if value is empty
    dispatch(setSearchQuery(debouncedValue || ''))

    // Batch all URL changes together
    const params = new URLSearchParams(searchParams.toString())

    // Update search parameter - explicitly handle empty string case
    if (debouncedValue && debouncedValue.trim() !== '') {
      params.set('search', debouncedValue)
    } else {
      // Always remove search param when value is empty or just whitespace
      params.delete('search')
    }

    // Reset to page 1
    params.set('page', '1')

    // Single URL update
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [debouncedValue, dispatch, router, searchParams, pathname])

  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || ''

    setValue(searchFromUrl)
    setDebouncedValue(searchFromUrl)
  }, [searchParams])

  useEffect(() => {
    if (resetSignal > 0) {
      setValue('')
      setDebouncedValue('')
      hasUserInteracted.current = false
    }
  }, [resetSignal])

  return (
    <CustomTextField
      {...props}
      value={value}
      onChange={e => {
        hasUserInteracted.current = true
        setValue(e.target.value)
        props.onChange?.(e.target.value)
      }}
    />
  )
}

const CoinPlanHistory = () => {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const { history, loading, page, pageSize, total, dateRange, adminEarnings, paymentGateway } = useSelector(
    state => state.coinPlanHistory
  )

  const { defaultCurrency } = useSelector(state => state.currency)

  useEffect(() => {
    if (!defaultCurrency) {
      dispatch(fetchDefaultCurrencies())
    }
  }, [])

  const { startDate, endDate } = dateRange

  // Initialize date filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: startDate || 'All',
    endDate: endDate || 'All'
  })

  const urlPage = parseInt(searchParams.get('page') || '1')
  const urlPageSize = parseInt(searchParams.get('pageSize') || '10')
  const urlStartDate = searchParams.get('startDate') || 'All'
  const urlEndDate = searchParams.get('endDate') || 'All'
  const urlSearch = searchParams.get('search') || ''
  const urlPaymentGateway = searchParams.get('paymentGateway') || 'All'

  // Fetch data on initial load and when page, pageSize, dateRange, or search changes

  useEffect(() => {
    dispatch(
      fetchCoinPlanHistory({
        page: urlPage,
        limit: urlPageSize,
        startDate: urlStartDate,
        endDate: urlEndDate,
        search: urlSearch,
        paymentGateway: urlPaymentGateway
      })
    )
  }, [dispatch, urlPage, urlPageSize, urlStartDate, urlEndDate, urlSearch, urlPaymentGateway])

  // Handle date range apply
  const handleDateRangeApply = (start, end) => {
    if (!(dateRange.endDate === end && dateRange.startDate === start)) {
      setDateFilter({ startDate: start, endDate: end })
      dispatch(setDateRange({ startDate: start, endDate: end }))
    }

    // setDateFilter({
    //   startDate: start,
    //   endDate: end
    // })
  }

  const [expandedRows, setExpandedRows] = useState({})
  const [resetKey, setResetKey] = useState(0)

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter({
      startDate: 'All',
      endDate: 'All'
    })

    dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
  }

  // Check if date filter is applied
  const isDateFiltered = dateRange.startDate !== 'All' || dateRange.endDate !== 'All'

  // Check if any filter is active
  const isFilterActive = useMemo(() => {
    return (
      urlSearch?.trim() ||
      searchParams.get('startDate') ||
      searchParams.get('endDate') ||
      urlPage !== 1 ||
      urlPageSize !== 10 ||
      urlPaymentGateway !== 'All'
    )
  }, [urlSearch, searchParams, urlPage, urlPageSize, urlPaymentGateway])

  // Handle reset filters
  const handleResetFilters = () => {
    // Reset search query
    dispatch(setSearchQuery(''))
    setResetKey(prev => prev + 1) // Force re-render of DebouncedInput to clear input

    // Reset date range
    dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))

    // Reset page to 1
    dispatch(setPage(1))
    dispatch(setPageSize(10))

    // Reset payment gateway
    dispatch(setPaymentGateway('All'))

    setResetKey(prev => prev + 1)

    router.replace(`${pathname}?page=1&pageSize=10&paymentGateway=All`, { scroll: false })
  }

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('nickName', {
        header: 'User',
        cell: ({ row }) => {
          const user = row.original
          const { nickName, fullName, profilePic } = row.original

          return (
            <div className='flex items-center gap-3'>
              {/* Avatar (clickable) */}
              <Link href={`/apps/user/view?userId=${user._id}`} className='shrink-0'>
                {user?.profilePic ? (
                  <CustomAvatar src={getFullImageUrl(user?.profilePic)} size={40} />
                ) : (
                  <CustomAvatar size={40}>{getInitials(user?.fullName || user?.nickName)}</CustomAvatar>
                )}
              </Link>

              {/* Name + Nickname + Unique ID */}
              <div className='flex flex-col'>
                {/* Name (clickable) */}
                <Link href={`/apps/user/view?userId=${user._id}`}>
                  <Typography color='text.primary' className='font-medium cursor-pointer'>
                    {user?.fullName || '-'}
                  </Typography>
                </Link>

                {/* Nickname (copyable) */}
                <Typography
                  variant='body2'
                  className='text-gray-400 select-all cursor-text'
                  onClick={e => e.stopPropagation()}
                >
                  {user?.nickName || '-'}
                </Typography>

                {/* Unique ID (copyable) */}
                <div className='flex items-center gap-1'>
                  <Typography
                    variant='body2'
                    className='text-gray-400 select-all cursor-text'
                    onClick={e => e.stopPropagation()}
                  >
                    {user?.uniqueId || '-'}
                  </Typography>
                  <Tooltip title='Copy Payment History' placement='top'>
                    <IconButton
                      size='small'
                      onClick={() => handleCopy(user?.uniqueId)}
                      className='text-gray-400 hover:text-primary'
                    >
                      <ContentCopyIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </div>
          )
        }
      }),
      columnHelper.accessor('userCoin', {
        header: `Total Coins`,
        cell: ({ getValue }) => (
          <div className='flex items-center gap-2'>
            <img src='/images/tcoin.png' alt='coin' className='w-4 h-4' />
            <Typography>{getValue()?.toFixed(2) || '0.00'} </Typography>
          </div>
        )
      }),
      columnHelper.accessor('price', {
        header: 'Price',
        cell: ({ getValue }) => (
          <Typography>{(defaultCurrency?.symbol || '₹') + ' ' + getValue()?.toFixed(2) || '0.00'} </Typography>
        )
      }),
      columnHelper.accessor('paymentGateway', {
        header: 'Payment Gateway',
        cell: ({ getValue }) => <Typography>{getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: ({ getValue }) => <Typography>{formatDateTime(getValue()) || '-'}</Typography>
      })
    ],
    [expandedRows, defaultCurrency?.symbol]
  )

  const table = useReactTable({
    data: history,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  const updateUrlPagination = (page, pageSize) => {
    const params = new URLSearchParams(searchParams.toString())

    if (page !== 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }

    if (pageSize !== 10) {
      params.set('pageSize', pageSize.toString())
    } else {
      params.delete('pageSize')
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleRowsPerPageChange = e => {
    const newPageSize = parseInt(e.target.value, 10)

    dispatch(setPageSize(newPageSize))
    dispatch(setPage(1))
    updateUrlPagination(1, newPageSize)
    dispatch(setPageSize(newPageSize))

    const params = new URLSearchParams(searchParams.toString())

    params.set('page', '1')
    params.set('pageSize', newPageSize.toString())
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handlePaymentGatewayChange = e => {
    const val = e.target.value

    dispatch(setPaymentGateway(val))
    dispatch(setPage(1))

    const params = new URLSearchParams(searchParams.toString())

    if (val && val !== 'All') {
      params.set('paymentGateway', val)
    } else {
      params.delete('paymentGateway')
    }

    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handlePageChange = newPage => {
    dispatch(setPage(newPage))
    updateUrlPagination(newPage, searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize'), 10) : pageSize)
  }

  return (
    <Box>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Box className='mb-3'>
          <Typography variant='h4'>Coin Plan Purchase History</Typography>
          <Typography variant='body2' color='text.secondary'>
            Track user coin purchases, spending history, and platform earnings.
          </Typography>
        </Box>

        <div className='flex items-center gap-4'>
          <CustomAvatar variant='rounded' color='success' skin='light'>
            <i className='tabler-coin' />
          </CustomAvatar>
          <div>
            <Typography variant='h5'>
              {defaultCurrency?.symbol || '₹'} {adminEarnings.toFixed(2) || '0'}
            </Typography>
            <Typography>Total Earnings</Typography>
          </div>
        </div>
      </Box>

      <Card className=''>
        <div className='flex justify-between flex-col md:flex-row md:items-center p-6 gap-4'>
          <div className='flex items-center justify-between gap-4 w-full flex-wrap'>
            <div className='flex items-center gap-4'>
              <CustomTextField
                select
                value={searchParams.get('pageSize') || 10}
                onChange={handleRowsPerPageChange}
                className='max-sm:is-full sm:is-[80px]'
              >
                <MenuItem value='10'>10</MenuItem>
                <MenuItem value='25'>25</MenuItem>
                <MenuItem value='50'>50</MenuItem>
                <MenuItem value='100'>100</MenuItem>
              </CustomTextField>

              <CustomTextField
                select
                value={urlPaymentGateway}
                onChange={handlePaymentGatewayChange}
                className='max-sm:is-full sm:is-[190px]'
              >
                <MenuItem value='All'>Payment Gateway</MenuItem>
                <MenuItem value='Cashfree'>Cashfree</MenuItem>
                <MenuItem value='Paypal'>Paypal</MenuItem>
                <MenuItem value='Paystack'>Paystack</MenuItem>
                <MenuItem value='Stripe'>Stripe</MenuItem>
                <MenuItem value='RazorPay'>RazorPay</MenuItem>
                <MenuItem value='In App Purchase'>In App Purchase</MenuItem>
              </CustomTextField>
            </div>

            <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
              <DebouncedInput
                key={resetKey}
                resetSignal={resetKey}
                value={searchParams.get('search') || ''}
                placeholder='Search By User, Unique Id, Email, Payment gateway'
                className='max-sm:is-full min-w-[400px]'
              />

              <DateRangePicker
                buttonText={
                  searchParams.get('startDate') && searchParams.get('endDate')
                    ? `${searchParams.get('startDate')} - ${searchParams.get('endDate')}`
                    : 'Date Range'
                }
                buttonStartIcon={<FilterListIcon />}
                buttonClassName='ms-2'
                setAction={setDateRange}
                initialStartDate={searchParams.get('startDate') ? new Date(startDate) : null}
                initialEndDate={searchParams.get('endDate') ? new Date(endDate) : null}
                showClearButton={searchParams.get('startDate') && searchParams.get('endDate')}
                onClear={() => {
                  dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
                  dispatch(setPage(1))
                  const params = new URLSearchParams(searchParams.toString())

                  params.delete('startDate')
                  params.delete('endDate')
                  params.set('page', '1')
                  router.replace(`${pathname}?${params.toString()}`, { scroll: false })
                }}
                onApply={(newStartDate, newEndDate) => {
                  dispatch(setDateRange({ startDate: newStartDate, endDate: newEndDate }))
                  dispatch(setPage(1))
                  const params = new URLSearchParams(searchParams.toString())

                  if (newStartDate !== 'All') params.set('startDate', newStartDate)
                  else params.delete('startDate')
                  if (newEndDate !== 'All') params.set('endDate', newEndDate)
                  else params.delete('endDate')
                  params.set('page', '1')
                  router.replace(`${pathname}?${params.toString()}`, { scroll: false })
                }}
              />

              <Tooltip title={isFilterActive ? 'Reset Filters' : 'No filters applied'}>
                <span>
                  <Fab
                    color={isFilterActive ? 'primary' : 'default'}
                    aria-label='reset'
                    size='medium'
                    sx={{ width: 40, height: 40 }}
                    disabled={!isFilterActive}
                    onClick={handleResetFilters}
                  >
                    <FilterAltOffIcon />
                  </Fab>
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className='overflow-x-auto'>
          {loading ? (
            <div className='flex justify-center items-center p-6 h-[55vh]'>
              <CircularProgress />
            </div>
          ) : (
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className='text-left py-2 px-4 border-b'>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <React.Fragment key={row.id}>
                    <tr>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className='py-2 px-4  border-b'>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {expandedRows[row.id] && (
                      <tr>
                        <td colSpan={columns.length} className='pt-1 px-0'>
                          <div className=''>
                            <table className='min-w-full text-sm'>
                              <thead>
                                <tr className='text-left'>
                                  <th style={{ fontSize: '13px', fontWeight: 500 }}>Unique ID</th>
                                  <th style={{ fontSize: '13px', fontWeight: 500 }}>Payment Gateway</th>
                                  <th style={{ fontSize: '13px', fontWeight: 500 }}>Price</th>
                                  <th style={{ fontSize: '13px', fontWeight: 500 }}>Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.original.records.map((record, idx) => (
                                  <tr key={idx} className='border-t'>
                                    <td>{record.uniqueId}</td>
                                    <td>{record.paymentGateway}</td>
                                    <td>{defaultCurrency?.symbol + ' ' + record.price.toFixed(2)}</td>
                                    <td>{record.date}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                <EmprtyTableRow
                  limit={9}
                  data={history}
                  columns={columns}
                  noDataLebel={'No coin plan purchase history found'}
                />
              </tbody>
            </table>
          )}
        </div>

        <TablePaginationComponent
          page={searchParams.get('page') ? parseInt(searchParams.get('page'), 10) : page}
          pageSize={searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize'), 10) : pageSize}
          total={total}
          onPageChange={handlePageChange}
        />
      </Card>
    </Box>
  )
}

export default CoinPlanHistory
