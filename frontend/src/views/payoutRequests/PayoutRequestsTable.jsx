'use client'

import Tooltip from '@mui/material/Tooltip'
import { useEffect, useMemo, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import { Button, Card, CircularProgress, Fab, IconButton, MenuItem, Typography } from '@mui/material'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'

// Third-party Imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import classnames from 'classnames'
import { toast } from 'react-toastify'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

// Component Imports
import CustomAvatar from '@/@core/components/mui/Avatar'
import CustomTextField from '@/@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'

// Style Imports
import tableStyles from '@/@core/styles/table.module.css'
import { setPage, setPageSize, setSearchQuery } from '@/redux-store/slices/payoutRequests'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { getInitials } from '@/utils/getInitials'
import { formatDateTime } from '@/utils/format'

import DateRangePicker from '@/components/common/DateRangePicker'
import EmprtyTableRow from '@/components/common/EmprtyTableRow'

// Debounced Input Component
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

  // Initialize from URL on mount
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

export const handleCopy = async text => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Column Definitions
const columnHelper = createColumnHelper()

const PayoutRequestsTable = ({ personType, statusType, showActions, onAccept, onReject, handleReason }) => {
  const dispatch = useDispatch()
  const { requests, loading, page, pageSize, total } = useSelector(state => state.payoutRequests)
  const { profileData } = useSelector(state => state.adminSlice)
  const { defaultCurrency } = useSelector(state => state.currency)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const urlPageSize = parseInt(searchParams.get('pageSize')) || 10
  const [resetKey, setResetKey] = useState(0)



  console.log('personType-->', personType)

  // Get appropriate person label
  const getPersonLabel = useMemo(() => {
    switch (personType) {
      case 1:
        return 'Agency'
      case 2:
        return 'Host'
      case 3:
        return 'User'
      default:
        return 'Unknown'
    }
  }, [personType])

  // Format date
  const formatDate = dateString => {
    return formatDateTime(dateString)
  }

  const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
  }

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('user', {
        header: 'User',
        cell: ({ row }) => {
          const { listenerId } = row?.original
          const { name, image, uniqueId } = listenerId || {}

          return (
            <div className='flex items-center gap-4'>
              {getAvatar({ avatar: getFullImageUrl(image), fullName: name })}
              <div className='flex flex-col'>
                <Typography color='text.primary' className='font-medium'>
                  {name || '-'}
                </Typography>
                <div className='flex items-center gap-1'>
                  <Typography
                    variant='body2'
                    className='text-gray-400 select-all cursor-text'
                    onClick={e => e.stopPropagation()}
                  >
                    {uniqueId || '-'}
                  </Typography>
                  <IconButton
                    size='small'
                    onClick={() => handleCopy(uniqueId)}
                    className='text-gray-400 hover:text-primary'
                  >
                    <ContentCopyIcon fontSize='small' />
                  </IconButton>
                </div>
              </div>
            </div>
          )
        }
      }),
      columnHelper.accessor('uniqueId', {
        header: 'Unique Id',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.uniqueId || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('coin', {
        header: 'Coins',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <img src='/images/tcoin.png' alt='coin' className='w-4 h-4' />
            <Typography color='text.primary'>{row.original.coin || '0'}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('amount', {
        header: `Amount (${defaultCurrency?.symbol || '₹'})`,
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {defaultCurrency?.symbol + ' ' + row.original.amount || defaultCurrency?.symbol + ' ' + '0'}
          </Typography>
        )
      }),
      columnHelper.accessor('paymentGateway', {
        header: 'Payment Method',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.paymentGateway || '-'}</Typography>
      }),
      columnHelper.accessor('paymentDetails', {
        header: 'Payment Details',
        cell: ({ row }) => {
          const details = row.original.paymentDetails || {}

          return (
            <div className='flex flex-col'>
              {Object.entries(details).map(([key, value]) => (
                <Typography key={key} color='text.primary'>
                  {`${key}: ${value}`}
                </Typography>
              ))}
            </div>
          )
        }
      }),

      columnHelper.accessor('requestDate', {
        header: 'Request Date',
        cell: ({ row }) => <Typography color='text.primary'>{formatDate(row.original.requestDate)}</Typography>
      }),
      ...(personType !== 1
        ? [
          columnHelper.accessor('acceptOrDeclineDate', {
            header: personType === 2 ? 'Accepted Date' : 'Rejected Date',
            cell: ({ row }) => (
              <Typography color='text.primary'>{formatDate(row.original.acceptOrDeclineDate)}</Typography>
            )
          }),
          ...(personType === 3
            ? [
              columnHelper.accessor('reason', {
                header: 'Reason',
                cell: ({ row }) => (
                  <Tooltip title='Reject Reason' placement='top'>
                    <IconButton
                      color='text.primary'
                      onClick={() => {
                        handleReason && handleReason(row.original.reason)
                      }}
                    >
                      <i className='tabler-message-report text-textSecondary' />
                    </IconButton>
                  </Tooltip>
                )
              })
            ]
            : [])
        ]
        : []),
      ...(personType === 1
        ? [
          columnHelper.accessor('actions', {
            header: () => <div className='text-center'>Actions</div>,
            cell: ({ row }) => {
              const BLOCKED_ID = '691822c8ea0bbcd6eaa74bdc'
              const isBlocked = row?.original?.listenerId?._id === BLOCKED_ID

              return (
                <div className='flex items-center justify-center gap-2'>
                  <Button
                    variant='contained'
                    color='success'
                    size='small'
                    onClick={() => {
                      if (isBlocked) {
                        toast.error('This listener cannot be approved.')
                        return // ⛔ Prevent API call
                      }

                      onAccept && onAccept(row.original._id, row.original.listenerId._id)
                    }}
                  >
                    Approve
                  </Button>

                  <Button
                    variant='outlined'
                    color='error'
                    size='small'
                    onClick={() => {
                      if (isBlocked) {
                        toast.error('This listener cannot be rejected.')
                        return // ⛔ Prevent API call
                      }

                      onReject && onReject(row.original._id, row.original.listenerId._id)
                    }}
                  >
                    Reject
                  </Button>
                </div>
              )
            },
            enableSorting: false
          })
        ]
        : [])
    ],
    [personType, statusType, showActions, getPersonLabel, onAccept, onReject]
  )

  // Initialize table
  const table = useReactTable({
    data: requests || [],
    columns,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: pageSize
      }
    },
    manualPagination: true,
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
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
  }

  const handlePageChange = newPage => {
    dispatch(setPage(newPage))
    updateUrlPagination(newPage, searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize'), 10) : pageSize)
  }

  // Check if any filters are active
  const isFilterActive = useMemo(() => {
    return searchParams.get('search') || searchParams.get('startDate') || searchParams.get('endDate')
  }, [searchParams])

  // Handle reset filters
  const handleResetFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Remove all filter parameters
    params.delete('search')
    params.delete('startDate')
    params.delete('endDate')
    params.set('page', '1') // Reset to first page

    // Update Redux state
    dispatch(setSearchQuery(''))

    // Update URL
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    // Increment reset key to trigger DebouncedInput reset
    setResetKey(prev => prev + 1)
  }

  return (
    <>
      <Card>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
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

          <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
            <DebouncedInput
              key={resetKey}
              resetSignal={resetKey}
              value={searchParams.get('search') || ''}
              placeholder='Search By User, Or Unique Id'
              className='max-sm:is-full min-w-[240px]'
            />

            <DateRangePicker
              buttonText={
                searchParams.get('startDate') && searchParams.get('endDate')
                  ? `${searchParams.get('startDate')} - ${searchParams.get('endDate')}`
                  : 'Date Range'
              }
              buttonStartIcon={<i className='tabler-calendar' />}
              // setAction={setDateRange}
              initialStartDate={searchParams.get('startDate') || null}
              initialEndDate={searchParams.get('endDate') || null}
              showClearButton={searchParams.get('startDate') && searchParams.get('endDate')}
              onApply={(newStartDate, newEndDate) => {
                const params = new URLSearchParams(searchParams.toString())

                if (newStartDate !== 'All') params.set('startDate', newStartDate)
                else params.delete('startDate')
                if (newEndDate !== 'All') params.set('endDate', newEndDate)
                else params.delete('endDate')
                params.get('page') && params.set('page', '1')
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
              }}
              onClear={() => {
                const params = new URLSearchParams(searchParams.toString())

                params.delete('startDate')
                params.delete('endDate')
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

        {loading ? (
          <div className='flex items-center justify-center p- h-[55vh]'>
            <CircularProgress />
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead className='border-b'>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='tabler-chevron-up text-xl' />,
                              desc: <i className='tabler-chevron-down text-xl' />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length > 0
                  ? table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                  : // <tr style={{borderBottom : "none"}}>
                  //   <td colSpan={columns.length} className='text-center p-4'>
                  //     <Typography>No payout requests found</Typography>
                  //   </td>
                  // </tr>
                  ''}
                <EmprtyTableRow limit={9} data={requests} columns={columns} noDataLebel={'No payout requests found'} />
              </tbody>
            </table>
          </div>
        )}

        <TablePaginationComponent
          page={searchParams.get('page') ? parseInt(searchParams.get('page'), 10) : page}
          pageSize={searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize'), 10) : pageSize}
          total={total}
          onPageChange={handlePageChange}
        />
      </Card>
    </>
  )
}

export default PayoutRequestsTable
