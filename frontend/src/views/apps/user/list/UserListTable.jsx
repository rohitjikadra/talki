'use client'

// React Imports
import { useEffect, useMemo, useRef, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import { Chip, CircularProgress, Fab, Tooltip } from '@mui/material'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'

import MenuItem from '@mui/material/MenuItem'
import { styled, useTheme } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

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
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import classnames from 'classnames'

import { useDispatch, useSelector } from 'react-redux'

import { toast } from 'react-toastify'

// Component Imports
// import LiveUserDrawer from './LiveUserDrawer'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'

// import DateRangePicker from '@/views/song/list/DateRangePicker'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Style Imports
import {
  deleteLiveUser,
  deleteUser,
  setDateRange,
  setFilters,
  setPage,
  setPageSize,
  setSearchQuery,
  setUserData,
  toggleUserBlockStatus
} from '@/redux-store/slices/user'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { formatDateTime } from '@/utils/format'
import tableStyles from '@core/styles/table.module.css'

import DateRangePicker from '@/components/common/DateRangePicker'
import EmprtyTableRow from '@/components/common/EmprtyTableRow'
import defaultFlag from '../../../../../public/images/flags/default.png'
import GenderCell from '@/components/common/GenderCell'
import CoinUserDialog from './CoinUserDialog'
import SingleNotificationDialog from '@/components/dialogs/SingleNotificationDialog'

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({
    itemRank
  })

  return itemRank.passed
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

  // Initialize from URL on mount
  // useEffect(() => {
  //   const searchFromUrl = searchParams.get('search')

  //   if (searchFromUrl && !value && !hasUserInteracted.current) {
  //     setValue(searchFromUrl)
  //     setDebouncedValue(searchFromUrl)
  //     dispatch(setSearchQuery(searchFromUrl))
  //   }

  //   return () => {
  //     dispatch(setUserData(null))
  //   }
  // }, [searchParams, value, dispatch])

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

  // 🔹 ⬇️ ADD THIS BLOCK ⬇️
  // useEffect(() => {
  //   setValue(initialValue || '')
  //   setDebouncedValue(initialValue || '')
  // }, [initialValue])

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

export const truncateString = (str, maxLength) => {
  if (!str) return ''

  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}

export const handleCopy = async text => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const LoginTypeColor = {
  1: 'error',
  2: 'info',
  3: 'warning',
  4: 'success',
  5: 'primary'
}

// Column Definitions
const columnHelper = createColumnHelper()

const UserListTable = ({ breakpoint = 'lg' }) => {
  // separate States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [liveUserOpen, setLiveUserOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedUserFullName, setSelectedUserFullName] = useState(null)
  const [isLiveUserEdit, setIsLiveUserEdit] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [coinAdjustDialogOpen, setCoinAdjustDialogOpen] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [singleNotificationOpen, setSingleNotificationOpen] = useState(false)

  // Redux state
  const { status, user, pageSize, page, type, initialLoad, total, loading } = useSelector(state => state.userReducer)
  const { profileData } = useSelector(state => state.adminSlice)

  const { startDate, endDate } = useSelector(state => state.userReducer)

  // Hooks
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const dispatch = useDispatch()

  const hasSyncedFromUrl = useRef(false)

  useEffect(() => {
    if (hasSyncedFromUrl.current) return

    const pageFromUrl = parseInt(searchParams.get('page'))
    const sizeFromUrl = parseInt(searchParams.get('pageSize'))
    const startDateFromUrl = searchParams.get('startDate')
    const endDateFromUrl = searchParams.get('endDate')

    if (!isNaN(pageFromUrl) && pageFromUrl !== page) dispatch(setPage(pageFromUrl))
    if (!isNaN(sizeFromUrl) && sizeFromUrl !== pageSize) dispatch(setPageSize(sizeFromUrl))
    if (startDateFromUrl && startDateFromUrl !== startDate)
      dispatch(setDateRange({ startDate: startDateFromUrl, endDate: endDate }))
    if (endDateFromUrl && endDateFromUrl !== endDate)
      dispatch(setDateRange({ startDate: startDate, endDate: endDateFromUrl }))

    hasSyncedFromUrl.current = true
  }, [searchParams, dispatch, page, pageSize, startDate, endDate])

  const urlPage = parseInt(searchParams.get('page')) || 1
  const urlPageSize = parseInt(searchParams.get('pageSize')) || 10

  const updateUrlPagination = (page, pageSize) => {
    const currentPage = parseInt(searchParams.get('page') || '1')
    const currentPageSize = parseInt(searchParams.get('pageSize') || '10')

    if (page === currentPage && pageSize === currentPageSize) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())

    params.set('page', page.toString())
    params.set('pageSize', pageSize.toString())
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    dispatch(setPage(page))
    dispatch(setPageSize(pageSize))
  }

  const lastValidDataRef = useRef({})

  const isDataValid = useMemo(() => {
    // Get current type from URL
    const currentUrlType = parseInt(searchParams.get('type') || '1')

    if (!user || user.length === 0) return true

    if (currentUrlType === 3) {
      return user.some(
        item => item.hasOwnProperty('streamType') || (item.hasOwnProperty('userId') && typeof item.userId === 'object')
      )
    }

    return !user.some(
      item => item.hasOwnProperty('streamType') || (item.hasOwnProperty('userId') && typeof item.userId === 'object')
    )
  }, [user, searchParams])

  useEffect(() => {
    // Get current type from URL
    const currentUrlType = parseInt(searchParams.get('type') || '1')

    if (user && user.length > 0 && isDataValid) {
      lastValidDataRef.current[currentUrlType] = [...user]
    }
  }, [user, isDataValid, searchParams])

  const shouldShowLoading = useMemo(() => {
    // Get current type from URL
    const currentUrlType = parseInt(searchParams.get('type') || '1')

    if (lastValidDataRef.current[currentUrlType]?.length > 0) {
      return false
    }

    if (user && user.length > 0 && isDataValid) {
      return false
    }

    if (status === 'loading' || initialLoad) {
      return true
    }

    if (!isDataValid) {
      return true
    }

    return false
  }, [user, status, initialLoad, isDataValid, searchParams])

  const showNoDataMessage = useMemo(() => {
    return !shouldShowLoading && isDataValid && (!user || user.length === 0) && status === 'succeeded'
  }, [shouldShowLoading, isDataValid, user, status])

  // Vars
  let breakpointValue

  switch (breakpoint) {
    case 'xxl':
      breakpointValue = '1920px'
      break
    case 'xl':
      breakpointValue = `${theme.breakpoints.values.xl}px`
      break
    case 'lg':
      breakpointValue = `${theme.breakpoints.values.lg}px`
      break
    case 'md':
      breakpointValue = `${theme.breakpoints.values.md}px`
      break
    case 'sm':
      breakpointValue = `${theme.breakpoints.values.sm}px`
      break
    case 'xs':
      breakpointValue = `${theme.breakpoints.values.xs}px`
      break
    default:
      breakpointValue = breakpoint
  }

  const protectedUserIds = ['691822c8ea0bbcd6eaa74bdc', '69300145d361c41a005f7225', '692ffc77d361c41a005f711c']

  const columns = useMemo(() => {
    const currentUrlType = parseInt(searchParams.get('type') || '1')

    const baseColumns = [
      columnHelper.accessor('fullName', {
        header: () => <div>User</div>,
        cell: ({ row }) => {
          const user = row.original
          const name = row.original.fullName
          const image = row.original.profilePic

          return (
            <Link
              href={`/apps/user/view?userId=${user._id}`}
              className='flex items-center gap-4'
              onClick={() => {
                dispatch(setUserData(user))
                dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
                localStorage.setItem('selectedUser', JSON.stringify(user))
              }}
            >
              {getAvatar({ avatar: getFullImageUrl(image), fullName: name })}

              <div className='flex flex-col'>
                <Typography color='text.primary' className='font-medium hover:underline cursor-pointer'>
                  {name || '-'}
                </Typography>

                {user.nickName && <Typography variant='body2'>{user.nickName}</Typography>}
              </div>
            </Link>
          )
        }
      }),

      columnHelper.accessor('email', {
        header: () => <div className=''>Email</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' className='cursor-pointer' onClick={() => handleCopy(row.original.email)}>
            {row.original.loginType !== 2 ? row.original.email || '-' : truncateString(row.original.email, 20)}
          </Typography>
        )
      }),
      columnHelper.accessor('gender', {
        header: () => <div>Gender</div>,
        cell: ({ row }) => <GenderCell gender={row.original.gender} />
      }),

      columnHelper.accessor('phoneNumber', {
        header: () => <div className=''>Phone Number</div>,
        cell: ({ row }) => (
          <Typography textTransform={'capitalize'} color='text.primary'>
            {row.original.phoneNumber || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('uniqueId', {
        header: () => <div className=''>Unique Id</div>,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography textTransform={'capitalize'} color='text.primary'>
              {row.original.uniqueId || '-'}
            </Typography>
            <ContentCopyIcon
              className='cursor-pointer'
              onClick={() => handleCopy(row.original.uniqueId)}
            />
          </div>
        )
      }),
      columnHelper.accessor('coin', {
        header: () => <div>Coin</div>,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <img
              src='/images/tcoin.png' // 👈 your coin image path
              alt='coin'
              className='w-4 h-4'
            />

            <Typography textTransform='capitalize' color='text.primary'>
              {row.original.coins || 0}
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
      columnHelper.accessor('isListener', {
        header: () => <div className=''>Is Listener</div>,
        cell: ({ row }) => {
          if (row.original.isListener) {
            return <Chip size='small' label='Listener' color='info' variant='tonal' />
          } else {
            return <Chip size='small' label='User' color='primary' variant='tonal' />
          }
        }
      }),
      columnHelper.accessor('Login Type', {
        header: () => <div className=''>Login Type</div>,
        cell: ({ row }) => {
          const loginTypeMap = {
            1: 'Google',
            2: 'Quick',
            3: 'Mobile Number',
            4: 'Email',
            5: 'Apple'
          }
          const type = row.original?.loginType
          return (
            <Chip
              size='small'
              label={loginTypeMap[type] ?? 'Unknown'}
              color={LoginTypeColor[type] ?? 'default'}
              variant='tonal'
            />
          )
        }
      }),
      columnHelper.accessor('isBusy', {
        header: () => <div className=''>Busy</div>,
        cell: ({ row }) => {
          if (row.original.isBusy) {
            return <Chip size='small' label={'Busy'} color='success' variant='tonal' />
          } else {
            return <Chip size='small' label={'Available'} color='info' variant='tonal' />
          }
        }
      })
    ]

    let conditionalColumns = []

    conditionalColumns = [
      columnHelper.accessor('country', {
        header: () => <div>Country</div>,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            {row.original.countryFlagImage && (
              <img
                src={row.original.countryFlagImage}
                alt={row.original.country}
                width={20}
                height={15}
                onError={e => (e.target.src = defaultFlag.src)}
              />
            )}
            <Typography className='capitalize' color='text.primary'>
              {row.original.country || '-'}
            </Typography>
          </div>
        )
      }),

      columnHelper.accessor('isBlock', {
        header: () => <div className=''>Block</div>,
        cell: ({ row }) => {
          const userId = row.original._id
          const isProtected = protectedUserIds.includes(userId)
          return (
            <Switch
              id={`block-switch-${userId}`}
              checked={Boolean(row.original.isBlock)}
              disabled={isProtected} // ⛔ Disable UI toggle for these users
              onChange={() => {
                if (isProtected) {
                  toast.error('This user cannot be blocked.')
                  return
                }

                

                dispatch(toggleUserBlockStatus({ id: userId }))
              }}
            />
          )
        }
      })
    ]

    const dateColumn = [
      columnHelper.accessor('birthDate', {
        header: () => <div className=''>Date of Birth</div>,
        cell: ({ row }) => <Typography color='text.primary'>{row.original.birthDate || '-'}</Typography>
      }),

      columnHelper.accessor('createdAt', {
        header: () => <div>Date</div>,
        cell: ({ row }) => (
          <Typography color='text.primary'>{formatDateTime(row.original.createdAt) || '-'}</Typography>
        )
      })
    ]

    const lastLoginColumn = [
      columnHelper.accessor('lastlogin', {
        header: () => <div>Last Login</div>,
        cell: ({ row }) => (
          <Typography color='text.primary'>{formatDateTime(row.original.lastlogin) || '-'}</Typography>
        )
      })
    ]

    const actionColumn = [
      columnHelper.accessor('action', {
        header: () => <div className='text-center'>Action</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-between'>
            <Tooltip title="View User" placement="top"><IconButton>
              <Link
                onClick={() => {
                  dispatch(setUserData(row.original))
                  dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('selectedUser', JSON.stringify({ ...row.original }))
                  }
                }}
                href={`/apps/user/view?userId=${row.original._id}`}
                className='flex'
              >
                <i className='tabler-eye text-textSecondary' />
              </Link>
            </IconButton></Tooltip>

            <Tooltip title="Manage User Coins" placement="top"><IconButton
              onClick={() => {
                setSelectedUser(row.original)
                setCoinAdjustDialogOpen(true)
              }}
            >
              <i className='tabler-coins text-textSecondary' />
            </IconButton></Tooltip>

            <Tooltip title="Manage User Notification" placement="top"><IconButton
              onClick={() => {
                setSelectedUserId(row.original._id)
                setSelectedUserFullName(row.original.fullName)
                setSingleNotificationOpen(true)
              }}
            >
              <i className='tabler-bell text-textSecondary' />
            </IconButton></Tooltip>
          </div>
        ),
        enableSorting: false
      })
    ]

    return [...baseColumns, ...conditionalColumns, ...dateColumn, ...lastLoginColumn, ...actionColumn]
  }, [dispatch, user, searchParams])

  // const processedTableData = useMemo(() => {
  //   const currentUrlType = parseInt(searchParams.get('type') || '1')

  //   if (user && user.length > 0 && isDataValid) {
  //     return user
  //   }

  //   if (lastValidDataRef.current[currentUrlType]?.length > 0) {
  //     return lastValidDataRef.current[currentUrlType]
  //   }

  //   return []
  // }, [user, isDataValid, searchParams])

  const table = useReactTable({
    data: user,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: urlPage - 1,
        pageSize: urlPageSize
      }
    },
    enableSorting: false,
    manualPagination: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: updateUrlPagination,
    onPageSizeChange: updateUrlPagination,
    onSearchChange: updateUrlPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete?.id) return

    try {
      setDeleteLoading(true)
      setDeleteError(null)

      if (userToDelete.isLiveUser) {
        await dispatch(deleteLiveUser(userToDelete.id)).unwrap()
      } else {
        await dispatch(deleteUser(userToDelete.id)).unwrap()
      }

      setDeleteConfirmOpen(false)
    } catch (error) {
      setDeleteError(error.toString())
    } finally {
      setDeleteLoading(false)
    }
  }

  const updateUrlParams = updates => {
    const params = new URLSearchParams(searchParams.toString())

    // Check if any values have actually changed
    let hasChanged = false

    Object.entries(updates).forEach(([key, value]) => {
      const currentValue = params.get(key)

      // Compare current value with new value
      if (value === null || value === undefined || value === 'All') {
        // Should delete this param
        if (currentValue !== null) {
          hasChanged = true
        }
      } else if (currentValue !== value.toString()) {
        // Value has changed
        hasChanged = true
      }
    })

    // If nothing changed, don't update URL
    if (!hasChanged) {
      return
    }

    // Always reset page to 1 when changing filters
    params.set('page', '1')

    // Apply all updates at once
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === 'All') {
        params.delete(key)
      } else {
        // Ensure value is stored as a string to avoid type conversion issues
        params.set(key, value.toString())
      }
    })

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const [localFilters, setLocalFilters] = useState({
    status: 'All'
  })

  const handleFilterChange = (filterName, value) => {
    const newFilters = {
      ...localFilters,
      [filterName]: value
    }

    setLocalFilters(newFilters)
    dispatch(setFilters(newFilters))
    const updates = {}

    if (filterName === 'status') {
      updates.isBlock = null
      updates.isOnline = null
      updates.isListener = null

      // Set the appropriate filter
      if (value === 'Blocked') {
        updates.isBlock = 'true'
      } else if (value === 'Unblocked') {
        updates.isBlock = 'false'
      } else if (value === 'Online') {
        updates.isOnline = 'true'
      } else if (value === 'Offline') {
        updates.isOnline = 'false'
      } else if (value === 'Listener') {
        updates.isListener = 'true'
      } else if (value === 'User') {
        updates.isListener = 'false'
      }
    } else if (filterName === 'role') {
      updates.role = value === 'All' ? null : value
    } else if (filterName === 'gender') {
      updates.gender = value === 'All' ? null : value
    }

    updateUrlParams(updates)
  }

  const isFilterActive = useMemo(() => {
    return (
      searchParams.get('search')?.trim() ||
      searchParams.get('startDate') ||
      searchParams.get('endDate') ||
      searchParams.get('isBlock') ||
      searchParams.get('isOnline') ||
      searchParams.get('isListener') ||
      searchParams.get('gender') ||
      urlPage !== 1 ||
      urlPageSize !== 10
    )
  }, [searchParams, urlPage, urlPageSize])

  const handleResetFilters = () => {
    // Reset search query
    dispatch(setSearchQuery(''))
    setGlobalFilter('')
    setResetKey(prev => prev + 1) // Force re-render of DebouncedInput to clear input

    // Reset status filter
    setLocalFilters({ status: 'All' })
    dispatch(setFilters({ status: 'All' }))

    // Reset date range
    dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))

    // Reset page to 1
    dispatch(setPage(1))

    // Update URL to remove all filter params
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('pageSize', searchParams.get('pageSize') || '10')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <Card>
        {/* <CardHeader title='Filters' className='pbe-4' /> */}
        {/* <TableFilters /> */}
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 gap-4'>
          <CustomTextField
            select
            value={searchParams.get('pageSize') || 10}
            onChange={e => {
              const newPageSize = Number(e.target.value)

              // dispatch(setPageSize(newPageSize))
              // dispatch(setPage(1))
              updateUrlPagination(1, newPageSize)
            }}
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
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search By User, Email, Phone Number Or Unique Id'
              className='max-sm:is-full min-w-[390px]'
            />

            <CustomTextField
              className='w-32'
              select
              id='select-status'
              value={
                searchParams.get('isBlock') === 'true'
                  ? 'Blocked'
                  : searchParams.get('isBlock') === 'false'
                    ? 'Unblocked'
                    : searchParams.get('isOnline') === 'true'
                      ? 'Online'
                      : searchParams.get('isOnline') === 'false'
                        ? 'Offline'
                        : searchParams.get('isListener') === 'true'
                          ? 'Listener'
                          : searchParams.get('isListener') === 'false'
                            ? 'User'
                            : 'All'
              }
              onChange={e => handleFilterChange('status', e.target.value)}
              slotProps={{
                select: { displayEmpty: true }
              }}
            >
              <MenuItem value='All'>All</MenuItem>
              <MenuItem value='Blocked'>Blocked</MenuItem>
              <MenuItem value='Unblocked'>Unblocked</MenuItem>
              <MenuItem value='Offline'>Offline</MenuItem>
              <MenuItem value='Online'>Online</MenuItem>
              <MenuItem value='Listener'>Listener</MenuItem>
              <MenuItem value='User'>User</MenuItem>
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
            {(() => {
              const currentUrlType = parseInt(searchParams.get('type') || '1')

              return (
                currentUrlType !== 1 && (
                  <Button
                    variant='contained'
                    startIcon={<i className='tabler-plus' />}
                    onClick={() => {
                      

                      if (currentUrlType === 3) {
                        setIsLiveUserEdit(false)
                        setLiveUserOpen(true)
                      } else {
                        setAddUserOpen(!addUserOpen)
                      }
                    }}
                    className='max-sm:is-full'
                  >
                    {currentUrlType === 1 ? 'Add New User' : currentUrlType === 2 ? 'Add Fake User' : 'Add Live User'}
                  </Button>
                )
              )
            })()}
          </div>
        </div>
        {shouldShowLoading || loading ? (
          <>
            <div className='flex items-center justify-center gap-2 grow is-full my-10 h-96'>
              <CircularProgress />
            </div>
          </>
        ) : (
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className='border'>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <>
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
                          </>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {showNoDataMessage
                  ? // <tr style={{ border: 'none' }} rowSpan={10}>
                  //   <td colSpan={table.getVisibleFlatColumns().length}  className='text-center'>
                  //     No data available
                  //   </td>
                  // </tr>
                  ''
                  : table.getRowModel().rows.map(row => {
                    return (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() }) + ' border-b '}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}

                <EmprtyTableRow limit={8} data={user} columns={columns} noDataLebel='No data available' />
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          component={() => (
            <TablePaginationComponent
              page={searchParams.get('page') ? parseInt(searchParams.get('page')) : 1}
              pageSize={searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')) : 10}
              total={total || 0}
              onPageChange={newPage => {
                updateUrlPagination(newPage, searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')) : 10)

                // dispatch(setPage(newPage))
              }}
            />
          )}
          count={total || 0}
          rowsPerPage={searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')) : 10}
          page={searchParams.get('page') - 1}
          onPageChange={(_, newPage) => {
            // dispatch(setPage(newPage))
            console.log('Run2')
            updateUrlPagination(newPage, searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')) : 10)
          }}
          onRowsPerPageChange={e => {
            const newSize = parseInt(e.target.value)

            // dispatch(setPageSize(newSize))
            updateUrlPagination(1, newSize)
          }}
        />
      </Card>
      {/* <AddUserDrawer open={addUserOpen} handleClose={() => setAddUserOpen(!addUserOpen)} /> */}
      {/* <EditUserDrawer open={editUserOpen} handleClose={() => setEditUserOpen(false)} userData={userToEdit} /> */}
      {/* <LiveUserDrawer
        open={liveUserOpen}
        handleClose={() => {
          setLiveUserOpen(false)
          setUserToEdit(null)
        }}
        editMode={isLiveUserEdit}
        initialData={userToEdit}
      /> */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        setOpen={setDeleteConfirmOpen}
        type='delete-customer'
        onConfirm={handleDeleteUser}
        loading={deleteLoading}
        error={deleteError}
      />

      {/* Coin Adjustment Dialog */}
      <CoinUserDialog
        open={coinAdjustDialogOpen}
        onClose={() => {
          setCoinAdjustDialogOpen(false)
          setSelectedUser(null)
        }}
        editData={selectedUser}
        coinAdjustmentMode={true}
      />

      <SingleNotificationDialog
        open={singleNotificationOpen}
        handleClose={() => setSingleNotificationOpen(false)}
        userId={selectedUserId}
        userFullName={selectedUserFullName}
        notificationType='user'
      />
      {/* <UserDetailDialog
        open={isUserDialogOpen}
        onClose={() => {
          setIsUserDialogOpen(false)
          setSelectedUserId(null)
        }}
        userId={selectedUserId}
      /> */}
    </>
  )
}

export default UserListTable
