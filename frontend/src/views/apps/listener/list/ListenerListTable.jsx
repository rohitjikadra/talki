'use client'

// React Imports
import { useEffect, useMemo, useRef, useState } from 'react'

// Next Imports
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import NotificationsIcon from '@mui/icons-material/Notifications'
import FilterListIcon from '@mui/icons-material/FilterList'
import { Chip, CircularProgress, Fab, Grid, Switch, Tooltip } from '@mui/material'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { formatDateTime } from '@/utils/format'

// Third-party Imports
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import classnames from 'classnames'

import { useDispatch, useSelector } from 'react-redux'

// Component Imports
import { Visibility } from '@mui/icons-material'

import { toast } from 'react-toastify'

import TablePaginationComponent from '@components/TablePaginationComponent'

import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import ListenerDialog from './ListenerDialog'
import SingleNotificationDialog from '@/components/dialogs/SingleNotificationDialog'
import CoinListenerDialog from './CoinListenerDialog'
// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Actions
import {
  blockListener,
  deleteListener,
  setDateRange,
  setPage,
  setPageSize,
  setSearchQuery,
  setSelectedListener
} from '@/redux-store/slices/listener'

// Utils
import Link from '@/components/Link'
import DateRangePicker from '@/components/common/DateRangePicker'
import EmprtyTableRow from '@/components/common/EmprtyTableRow'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { getFullImageUrl } from '@/utils/commonfunctions'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import { getInitials } from '@/utils/getInitials'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import { IconGenderMale, IconGenderFemale } from '@tabler/icons-react'

// Fuzzy filter for search functionality
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

export const handleCopy = async text => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Helper function for avatars
const DebouncedInput = ({ value, onChange, ...props }) => {
  const [internalValue, setInternalValue] = useState(value)
  const hasUserInteracted = useRef(false)
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 🔥 Parent value change → input sync (RESET works here)
  useEffect(() => {
    setInternalValue(value)
    if (value === '') {
      hasUserInteracted.current = false
    }
  }, [value])

  // Debounce logic
  useEffect(() => {
    if (!hasUserInteracted.current) return

    const handler = setTimeout(() => {
      dispatch(setSearchQuery(internalValue || ''))

      const params = new URLSearchParams(searchParams.toString())

      if (internalValue?.trim()) {
        params.set('search', internalValue)
      } else {
        params.delete('search')
      }

      params.set('page', '1')

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })

      // 🔥 parent ko notify
      onChange?.(internalValue)
    }, 500)

    return () => clearTimeout(handler)
  }, [internalValue])

  return (
    <CustomTextField
      {...props}
      value={internalValue}
      onChange={e => {
        hasUserInteracted.current = true
        setInternalValue(e.target.value)
      }}
    />
  )
}

const getAvatar = ({ avatar, fullName }) => {
  if (avatar) {
    return <CustomAvatar src={avatar} skin='light' sx={{ width: 38, height: 38 }} />
  } else {
    return (
      <CustomAvatar skin='light' sx={{ width: 38, height: 38 }}>
        {getInitials(fullName || 'Unknown')}
      </CustomAvatar>
    )
  }
}

// Column helper
const columnHelper = createColumnHelper()

const ListenerListTable = () => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  console.log('globalFilterValue', globalFilterValue)

  const [open, setOpen] = useState(false)
  const [listenerToEdit, setListenerToEdit] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [listenerToDelete, setListenerToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [singleNotificationOpen, setSingleNotificationOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedUserName, setSelectedUserName] = useState(null)
  const [coinAdjustDialogOpen, setCoinAdjustDialogOpen] = useState(false)
  const [selectedListenerForCoin, setSelectedListenerForCoin] = useState(null)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const theme = useTheme()
  const tabFromQuery = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromQuery ? tabFromQuery : 'real')

  const [localFilters, setLocalFilters] = useState({
    status: 'All'
  })

  useEffect(() => {
    const searchFromURL = searchParams.get('search') || ''
    setGlobalFilterValue(searchFromURL)
    dispatch(setSearchQuery(searchFromURL))
  }, [searchParams, dispatch])

  useEffect(() => {
    setActiveTab(tabFromQuery ? tabFromQuery : 'real')
  }, [tabFromQuery])

  useEffect(() => {
    dispatch(setSearchQuery(''))
    dispatch(setPage(1))
    dispatch(setPageSize(10))
  }, [dispatch])

  // Redux state
  const { listeners, total, loading, initialLoad, page, pageSize, startDate, endDate } = useSelector(
    state => state.listener
  )

  const { profileData } = useSelector(state => state.adminSlice)


  // Handle URL updates for pagination
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

  const updateUrlParams = updates => {
    const params = new URLSearchParams(searchParams.toString())

    let hasChanged = false

    Object.entries(updates).forEach(([key, value]) => {
      const currentValue = params.get(key)

      if (value === null || value === undefined || value === 'All') {
        if (currentValue !== null) hasChanged = true
      } else if (currentValue !== value.toString()) {
        hasChanged = true
      }
    })

    if (!hasChanged) return

    params.set('page', '1')

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === 'All') {
        params.delete(key)
      } else {
        params.set(key, value.toString())
      }
    })

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleFilterChange = (filterName, value) => {
    const newFilters = {
      ...localFilters,
      [filterName]: value
    }

    setLocalFilters(newFilters)

    const updates = {}

    if (filterName === 'status') {
      updates.isBlock = null
      updates.isOnline = null
      updates.isBusy = null

      if (value === 'Blocked') updates.isBlock = 'true'
      else if (value === 'Unblocked') updates.isBlock = 'false'
      else if (value === 'Online') updates.isOnline = 'true'
      else if (value === 'Offline') updates.isOnline = 'false'
      else if (value === 'Busy') updates.isBusy = 'true'
      else if (value === 'Available') updates.isBusy = 'false'
    } else if (filterName === 'gender') {
      updates.gender = value === 'All' ? null : value
    }
    dispatch(setPage(1))
    updateUrlParams(updates)
  }

  const isFilterActive = useMemo(() => {
    const params = searchParams

    return (
      // 🔍 Search
      globalFilterValue?.trim() ||
      // 📅 Date range
      params.get('startDate') ||
      params.get('endDate') ||
      // 🧩 Status filters
      params.get('isBlock') ||
      params.get('isOnline') ||
      params.get('isBusy') ||
      params.get('gender') ||
      // 📄 Pagination
      page !== 1 ||
      pageSize !== 10
    )
  }, [searchParams, globalFilterValue, page, pageSize])

  const resetFilters = () => {
    // Redux reset
    dispatch(setSearchQuery(''))
    dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
    dispatch(setPage(1))
    dispatch(setPageSize(10))

    // UI reset
    setGlobalFilterValue('')
    setLocalFilters({ status: 'All' })

    // URL reset (tab preserve)
    const params = new URLSearchParams()
    const tab = searchParams.get('tab')
    if (tab) params.set('tab', tab)

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Column definitions
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => <div className=''>Listener</div>,
        cell: ({ row }) => {
          const { name, image, uniqueId, nickName, gender } = row.original

          return (
            <Link
              href={`/apps/listener/view?userId=${row?.original?._id}`}
              className='flex items-center gap-4'
              onClick={() => {
                localStorage.setItem(
                  'selectedListener',
                  JSON.stringify({ ...row?.original, isFake: activeTab === 'fake' })
                )
                dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
              }}
            >
              {getAvatar({ avatar: getFullImageUrl(image), fullName: name })}
              <div className='flex flex-col'>
                <div>
                  <Typography color='text.primary' className='font-medium flex gap-1'>
                    {name || '-'}
                    {gender?.trim() && (
                      <Chip
                        icon={
                          gender === 'male' ? (
                            <IconGenderMale size={18} />
                          ) : gender === 'female' ? (
                            <IconGenderFemale size={18} />
                          ) : null
                        }
                        label={gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Not specified'}
                        size='small'
                      />
                    )}
                  </Typography>
                </div>
                {/* {nickName && <Chip color='info' variant='tonal' size='small' label={nickName} />} */}
                <Typography variant='body2'>{nickName || '-'}</Typography>
              </div>
            </Link>
          )
        }
      }),
      columnHelper.accessor('uniqueId', {
        header: () => <div className=''>Unique Id</div>,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography color='text.primary'>{row.original.uniqueId || '-'}</Typography>
            <IconButton onClick={() => handleCopy(row.original.uniqueId)} size='small'>
              <ContentCopyIcon fontSize='small' />
            </IconButton>
          </div>
        )
      }),
      columnHelper.accessor('age', {
        header: () => <div className=''>Age</div>,
        cell: ({ row }) => <Typography color='text.primary'>{row.original.age || '-'}</Typography>
      }),
      columnHelper.accessor('coin', {
        header: () => <div className=''>Coin</div>,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <img src='/images/tcoin.png' alt='coin' className='w-4 h-4' />
            <Typography textTransform={'capitalize'} color='text.primary'>
              {row.original.currentCoinBalance || 0}
            </Typography>
          </div>
        )
      }),

      columnHelper.accessor('isOnline', {
        header: () => <div className=''>Status</div>,
        cell: ({ row }) => {
          if (row.original.isOnline) {
            return <Chip size='small' label='Online' color='success' variant='tonal' />
          } else {
            return <Chip size='small' label='Offline' color='error' variant='tonal' />
          }
        }
      }),

      columnHelper.accessor('isBusy', {
        header: () => <div className=''>Busy</div>,
        cell: ({ row }) => {
          if (row.original.isBusy) {
            return <Chip size='small' label={'Busy'} color='info' variant='tonal' />
          } else {
            return <Chip size='small' label={'Available'} color='info' variant='tonal' />
          }
        }
      }),
      columnHelper.accessor('rating', {
        header: () => <div className='text-center'>Rating</div>,
        cell: ({ row }) => (
          <Typography textTransform={'capitalize'} color='text.primary'>
            {(row.original.rating || 0).toFixed(2)}
          </Typography>
        )
      }),
      columnHelper.accessor('callCount', {
        header: () => <div className='text-center'>Call Count</div>,
        cell: ({ row }) => (
          <Typography textTransform={'capitalize'} color='text.primary'>
            {row.original.callCount || 0}
          </Typography>
        )
      }),
      columnHelper.accessor('date', {
        header: () => <div className=''>Created At</div>,
        cell: ({ row }) => (
          <Typography textTransform={'capitalize'} color='text.primary'>
            {formatDateTime(row.original.date) || 0}
          </Typography>
        )
      }),

      columnHelper.accessor('isBlock', {
        header: () => <div className=''>Block</div>,
        cell: ({ row }) => (
          <Switch
            checked={row.original.isBlock}
            disabled={row.original._id === '691822c8ea0bbcd6eaa74bdc'}
            onChange={() => dispatch(blockListener(row.original._id))}
          />
        )
      }),

      columnHelper.accessor('action', {
        header: () => <div className=''>Action</div>,
        cell: ({ row }) => (
          <div className='flex justify-between gap-1'>
            <Tooltip title="Edit Listener" placement="top">
              <IconButton size='small' onClick={() => handleEditListener(row.original)}>
                <EditIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Listener" placement="top">
              <IconButton
                size='small'
                onClick={() => {
                  if (row.original._id === '691822c8ea0bbcd6eaa74bdc') {
                    toast.error('This listener cannot be deleted.')
                    return
                  }

                  handleDeleteListener(row.original._id) // ✅ Only call when allowed
                }}
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Listener" placement="top">
              <IconButton>
                <Link
                  onClick={() => {
                    // dispatch(setUserData(row.original))
                    localStorage.setItem(
                      'selectedListener',
                      JSON.stringify({ ...row.original, isFake: activeTab === 'fake' })
                    )
                    dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
                  }}
                  href={`/apps/listener/view?userId=${row.original._id}`}
                  className='flex'
                >
                  <Visibility fontSize={'small'} />
                </Link>
              </IconButton>
            </Tooltip>
            <Tooltip title="Send Notification" placement="top">
              <IconButton
                size='small'
                onClick={() => {
                  setSelectedUserId(row.original._id)
                  setSelectedUserName(row.original.name)
                  setSingleNotificationOpen(true)
                }}
              >
                <i className='tabler-bell text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title="Manage Listener Coins" placement="top">
              <IconButton
                onClick={() => {
                  setSelectedListenerForCoin(row.original)
                  setCoinAdjustDialogOpen(true)
                }}
              >
                <i className='tabler-coins text-textSecondary' />
              </IconButton>
            </Tooltip>
          </div>
        )
      })
    ],
    [activeTab]
  )

  const table = useReactTable({
    data: listeners,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter: globalFilterValue
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilterValue,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const handlePageChange = newPage => {
    dispatch(setPage(newPage))
    updateUrlPagination(newPage, searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize'), 10) : pageSize)
  }

  const handleRowsPerPageChange = e => {
    const newPageSize = parseInt(e.target.value, 10)

    dispatch(setPageSize(newPageSize))
    dispatch(setPage(1))
    updateUrlPagination(1, newPageSize)
  }

  const handleEditListener = listener => {
    setListenerToEdit(listener)
    dispatch(setSelectedListener(listener))
    setOpen(true)
  }

  const handleDeleteListener = listenerId => {
    setListenerToDelete(listenerId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteListener = async () => {
   

    if (listenerToDelete) {
      setDeleteLoading(true)

      try {
        await dispatch(deleteListener(listenerToDelete)).unwrap()
        setIsDeleteDialogOpen(false)
        setListenerToDelete(null)
      } catch (error) {
        console.log('Failed to delete listener:', error)
      } finally {
        setDeleteLoading(false)
      }
    }
  }

  const handleCreateListener = () => {
    setListenerToEdit(null)
    dispatch(setSelectedListener(null))
    setOpen(true)
  }

  const handleDialogClose = () => {
    setOpen(false)
    setListenerToEdit(null)
    dispatch(setSelectedListener(null))
  }

  return (
    <>
      <Card>
        <div className='flex flex-wrap gap-4 p-6 justify-between items-center'>
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
            {activeTab === 'real' && (
              <>
                <CustomTextField
                  className='w-32'
                  select
                  value={
                    searchParams.get('isBlock') === 'true'
                      ? 'Blocked'
                      : searchParams.get('isBlock') === 'false'
                        ? 'Unblocked'
                        : searchParams.get('isOnline') === 'true'
                          ? 'Online'
                          : searchParams.get('isOnline') === 'false'
                            ? 'Offline'
                            : searchParams.get('isBusy') === 'true'
                              ? 'Busy'
                              : searchParams.get('isBusy') === 'false'
                                ? 'Available'
                                : 'All'
                  }
                  onChange={e => handleFilterChange('status', e.target.value)}
                  slotProps={{
                    select: { displayEmpty: true }
                  }}
                >
                  <MenuItem value='All'>All</MenuItem>
                  <MenuItem value='Online'>Online</MenuItem>
                  <MenuItem value='Offline'>Offline</MenuItem>
                  <MenuItem value='Blocked'>Blocked</MenuItem>
                  <MenuItem value='Unblocked'>Unblocked</MenuItem>
                  <MenuItem value='Busy'>Busy</MenuItem>
                  <MenuItem value='Available'>Available</MenuItem>
                </CustomTextField>
                <CustomTextField
                  className='w-32'
                  select
                  id='select-gender'
                  value={searchParams.get('gender') || 'All'}
                  onChange={e => handleFilterChange('gender', e.target.value)}
                  slotProps={{
                    select: { displayEmpty: true }
                  }}
                >
                  <MenuItem value='All'>All</MenuItem>
                  <MenuItem value='male'>Male</MenuItem>
                  <MenuItem value='female'>Female</MenuItem>
                </CustomTextField>
              </>
            )}
          </div>

          <div className='flex gap-4'>
            <DebouncedInput
              value={globalFilterValue}
              onChange={setGlobalFilterValue}
              placeholder='Search By name, uniqueId, country, phone'
              className='max-sm:is-full min-w-[330px]'
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
                params.get('page') && params.set('page', '1')
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
                params.get('page') && params.set('page', '1')
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
              }}
            />
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreateListener}>
              Add Listener
            </Button>
            <Tooltip title={isFilterActive ? 'Reset Filters' : 'No filters applied'}>
              <span>
                <Fab
                  color={isFilterActive ? 'primary' : 'default'}
                  aria-label='reset'
                  size='medium'
                  sx={{ width: 40, height: 40 }}
                  disabled={!isFilterActive}
                  onClick={resetFilters}
                >
                  <FilterAltOffIcon />
                </Fab>
              </span>
            </Tooltip>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <div className={tableStyles.tableContainer}>
            {loading || initialLoad ? (
              <div className='flex justify-center items-center py-8 h-[55vh]'>
                <CircularProgress />
              </div>
            ) : (
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className={tableStyles.tableHeadCell}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length > 0
                    ? table.getRowModel().rows.map(row => (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className={tableStyles.tableBodyCell}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                    : ''}
                  <EmprtyTableRow limit={9} data={listeners} columns={{ columns }} noDataLebel={'No listeners found'} />
                </tbody>
              </table>
            )}
          </div>
        </div>
        {/* Pagination Component */}
        <TablePaginationComponent
          page={searchParams.get('page') ? parseInt(searchParams.get('page'), 10) : page}
          pageSize={searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize'), 10) : pageSize}
          total={total}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* Listener Dialog for Create/Edit */}
      <ListenerDialog open={open} onClose={handleDialogClose} listener={listenerToEdit} role={activeTab} />

      <SingleNotificationDialog
        open={singleNotificationOpen}
        handleClose={() => setSingleNotificationOpen(false)}
        userId={selectedUserId}
        userFullName={selectedUserName}
        notificationType='listener'
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        type='delete-listener'
        onConfirm={confirmDeleteListener}
        loading={deleteLoading}
      />

      {/* Coin Adjustment Dialog */}
      <CoinListenerDialog
        open={coinAdjustDialogOpen}
        onClose={() => {
          setCoinAdjustDialogOpen(false)
          setSelectedListenerForCoin(null)
        }}
        editData={selectedListenerForCoin}
        coinAdjustmentMode={true}
      />
    </>
  )
}

export default ListenerListTable
