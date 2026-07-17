// Optimized HostApplicationTable.jsx (based on UserListTable setup)
'use client'
import React, { useEffect, useMemo, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { IconGenderMale, IconGenderFemale } from '@tabler/icons-react'

import { useDispatch, useSelector } from 'react-redux'
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table'

// MUI
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import { Chip, IconButton } from '@mui/material'

// Components
import { toast } from 'react-toastify'

import CustomAvatar from '@/@core/components/mui/Avatar'
import CustomTextField from '@/@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'

// Utils
import { getInitials } from '@/utils/getInitials'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { formatDateTime } from '@/utils/format'

import tableStyles from '@core/styles/table.module.css'

import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import { Fab, Tooltip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

// Redux

import {
  fetchlistenerRequest,
  setPage,
  setPageSize,
  setStatus,
  setSearchQuery,
  setGender,
  setDateRange,
  APPLICATION_STATUS,
  handleListenerRequest
} from '@/redux-store/slices/listenerRequest'

import DateRangePicker from '@/components/common/DateRangePicker'
import FilterListIcon from '@mui/icons-material/FilterList'

import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import ReqReasonDialog from './ListenerReqDialouge'
import ReqViewDialog from './ListenerReqDialouge/ReqViewDialouge'

import EmprtyTableRow from '@/components/common/EmprtyTableRow'

export const handleCopy = async text => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const ListenerRequestTable = () => {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const { profileData } = useSelector(state => state.adminSlice)

  const { applications, total, page, pageSize, loading, initialLoad, status, startDate, endDate } = useSelector(
    state => state.hostApplication
  )

  const searchQuery = searchParams.get('search') || ''
  const urlGender = searchParams.get('gender') || 'All'
  const urlStartDate = searchParams.get('startDate') || 'All'
  const urlEndDate = searchParams.get('endDate') || 'All'

  

  const [confirmDelete, setConfirmDelete] = useState({ open: false, data: null, type: null })
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedData, setSelectedData] = useState(null)

  const urlPage = parseInt(searchParams.get('page') || '1')
  const urlPageSize = parseInt(searchParams.get('pageSize') || '10')

  const isFirstRender = React.useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return // ✅ do nothing on initial load
    }

    const params = new URLSearchParams(searchParams.toString())

    if (searchQuery?.trim()) {
      params.set('search', searchQuery)
    } else {
      params.delete('search')
    }

    // ✅ reset page ONLY when user changes search
    params.delete('page')

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false
    })
  }, [searchQuery])

  useEffect(() => {
    const fetchData = () => {
      dispatch(
        fetchlistenerRequest({
          page: urlPage,
          pageSize: urlPageSize,
          status,
          searchQuery,
          gender: urlGender,
          startDate: urlStartDate,
          endDate: urlEndDate
        })
      )
    }

    const timeoutId = setTimeout(fetchData, 50)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [dispatch, urlPage, urlPageSize, status, searchQuery, urlGender, urlStartDate, urlEndDate])

  const confirmDeleteAction = () => {
    

    if (confirmDelete.data) {
      dispatch(
        handleListenerRequest({
          requestId: confirmDelete?.data._id,
          userId: confirmDelete?.data.userId._id,
          type: confirmDelete.type
        })
      )
    }

    setConfirmDelete({ open: false, data: null, type: null })
  }

  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: 'User',
        accessorKey: 'userId.nickName',
        cell: ({ row }) => {
          const user = row.original.userId

          return (
            <div className='flex items-center gap-4'>
              <CustomAvatar src={user?.profilePic ? getFullImageUrl(user.profilePic) : ''} size={50}>
                {getInitials(user?.fullName || 'U')}
              </CustomAvatar>
              <div className='flex flex-col'>
                <div
                  className='flex items-center gap-1 cursor-pointer'
                  onClick={() => {
                    setSelectedData(row.original)
                    setOpenViewDialog(true)
                  }}
                >
                  <Typography color='text.primary' className='font-medium'>
                    {user?.fullName || '-'}
                  </Typography>
                  <Chip
                    icon={
                      user?.gender === 'male' ? (
                        <IconGenderMale size={16} />
                      ) : user?.gender === 'female' ? (
                        <IconGenderFemale size={16} />
                      ) : null
                    }
                    label={user?.gender === 'male' ? 'Male' : user?.gender === 'female' ? 'Female' : 'Not specified'}
                    size='small'
                  />
                </div>
                <Typography variant='body2'>{user?.nickName || '-'}</Typography>
                <div className='flex items-center gap-2'>
                  <Typography variant='body2'>{user?.uniqueId || '-'}</Typography>
                  <Tooltip title="Copy Application" placement="top"><IconButton onClick={() => handleCopy(user?.uniqueId)} size='small'>
                    <ContentCopyIcon fontSize='small' />
                  </IconButton></Tooltip>
                </div>
              </div>
            </div>
          )
        }
      },
      {
        header: 'Listener',
        accessorKey: 'userId.email',
        cell: ({ row }) => {
          const user = row.original

          return (
            <div className='flex items-center gap-4'>
              <CustomAvatar src={user?.profilePic ? getFullImageUrl(user?.image) : ''} size={50}>
                {getInitials(user?.name || 'U')}
              </CustomAvatar>
              <div className='flex flex-col'>
                <div className='flex items-center gap-1'>
                  <Typography color='text.primary' className='font-medium'>
                    {user?.name || '-'}
                  </Typography>
                  <Chip
                    icon={
                      user?.gender === 'male' ? (
                        <IconGenderMale size={18} />
                      ) : user?.gender === 'female' ? (
                        <IconGenderFemale size={18} />
                      ) : null
                    }
                    label={user?.gender === 'male' ? 'Male' : user?.gender === 'female' ? 'Female' : 'Not specified'}
                    size='small'
                  />
                </div>
                <Typography variant='body2'>{user?.nickName || '-'}</Typography>
                <Typography variant='body2'>
                  {user?.email
                    ? user.email.length > 30
                      ? user.email.slice(0, 30) + '...' + user.email.slice(user.email.indexOf('@'))
                      : user.email
                    : '-'}
                </Typography>
              </div>
            </div>
          )
        }
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const statusCode = Number(row.original.status)

          const statusMap = {
            [APPLICATION_STATUS.PENDING]: 'Pending',
            [APPLICATION_STATUS.APPROVED]: 'Approved',
            [APPLICATION_STATUS.REJECTED]: 'Rejected'
          }

          return (
            <Chip
              label={statusMap[statusCode] || 'Unknown'}
              size='small'
              color={
                statusMap[statusCode] === 'Approved'
                  ? 'success'
                  : statusMap[statusCode] === 'Rejected'
                    ? 'error'
                    : 'warning'
              }
              variant='tonal'
            />
          )
        }
      },
      {
        header: 'Requested Date',
        accessorKey: 'createdAt',
        cell: ({ row }) => {
          const createdAt = row.original.createdAt
          if (!createdAt) return '-'

          return formatDateTime(createdAt)
          // Optional custom format:
          // return date.toLocaleString('en-US', {
          //   year: 'numeric',
          //   month: '2-digit',
          //   day: '2-digit',
          //   hour: '2-digit',
          //   minute: '2-digit',
          //   second: '2-digit'
          // })
        }
      }
    ]

    if (status === APPLICATION_STATUS.APPROVED || status === APPLICATION_STATUS.REJECTED) {
      baseColumns.push({
        header: 'Review Date',
        accessorKey: 'reviewedAt',

        cell: ({ row }) => {
          const reviewedAt = row.original.reviewAt

          return formatDateTime(reviewedAt)
        }
      })
    }

    if (status === APPLICATION_STATUS.REJECTED) {
      baseColumns.push({
        header: 'Reason',
        accessorKey: 'reason',
        cell: ({ row }) => {
          const reason = row.original.reason
            ? row.original.reason.length > 30
              ? row.original.reason.slice(0, 30) + '...'
              : row.original.reason
            : ''

          return (
            <Typography variant='p' className='truncate'>
              {reason}
            </Typography>
          )
        }
      })
    }
    baseColumns.push({
      header: status === APPLICATION_STATUS.PENDING ? 'Action' : 'Preview',
      cell: ({ row }) => {
      

        return (
          <div>
            {status === APPLICATION_STATUS.PENDING && (
              <>
                <Tooltip title="Approve Application" placement="top"><IconButton
                  onClick={() => {
                   
                    handleApprove(row.original)
                  }}
                  title='Approve'
                >
                  <i className='tabler-circle-dashed-check text-textSecondary' />
                </IconButton></Tooltip>

                <Tooltip title="Reject Application" placement="top"><IconButton
                  onClick={() => {
                    
                    handleReject(row.original)
                  }}
                  title='Cancel'
                >
                  <i className='tabler-circle-dashed-x text-textSecondary' />
                </IconButton></Tooltip>
              </>
            )}

            {/* Always show Info button */}
            <Tooltip title="Application Info" placement="top"><IconButton
              onClick={() => {
                setSelectedData(row.original)
                setOpenViewDialog(true)
              }}
              title='Info'
            >
              <i className='tabler-info-circle text-textSecondary' />
            </IconButton></Tooltip>
          </div>
        )
      }
    })

    return baseColumns
  }, [status])

  const table = useReactTable({
    data: applications || [],
    columns,
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize
      }
    },
    onPaginationChange: updater => {
      if (typeof updater === 'function') {
        const { pageIndex, pageSize: newPageSize } = updater({
          pageIndex: page - 1,
          pageSize
        })

        const newPage = pageIndex + 1

        if (newPage !== page) dispatch(setPage(newPage))

        if (newPageSize !== pageSize) {
          dispatch(setPageSize(newPageSize))
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const handleApprove = data => {
    setConfirmDelete({ open: true, data: data, type: 2 })
  }

  const handleReject = data => {
    setSelectedData(data)
    setOpenDialog(true)
  }

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

  const DebouncedInput = ({ value, onChange, ...props }) => {
    const [localValue, setLocalValue] = useState(value)

    // Sync external value (Redux / URL) → input
    useEffect(() => {
      setLocalValue(value)
    }, [value])

    // Debounce only USER typing
    useEffect(() => {
      if (localValue === value) return

      const timer = setTimeout(() => {
        onChange(localValue)
      }, 500)

      return () => clearTimeout(timer)
    }, [localValue, value, onChange])

    return <CustomTextField value={localValue} onChange={e => setLocalValue(e.target.value)} {...props} />
  }

  const isFilterActive = useMemo(() => {
    return (
      // 🔍 Search
      searchQuery?.trim() ||
      // 🧩 Status filter
      // status !== APPLICATION_STATUS.PENDING ||

      // 📄 Pagination
      page !== 1 ||
      pageSize !== 10 ||
      urlGender !== 'All' ||
      urlStartDate !== 'All' ||
      urlEndDate !== 'All'
    )
  }, [searchQuery, urlGender, urlStartDate, urlEndDate, status, page, pageSize])

  const resetFilters = () => {
    dispatch(setStatus(APPLICATION_STATUS.PENDING))
    dispatch(setPage(1))
    dispatch(setPageSize(10))
    dispatch(setGender('All'))
    dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))

    const params = new URLSearchParams()
    params.set('tab', searchParams.get('tab') || 'pending')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <Card>
        <Box className='flex justify-between items-center p-6 border-b gap-4 flex-wrap'>
          <div className='flex items-center gap-4 flex-wrap'>
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

            {/* Gender Filter */}
            <CustomTextField
              className='w-36'
              select
              value={urlGender}
              onChange={e => {
                const val = e.target.value
                dispatch(setGender(val))
                const params = new URLSearchParams(searchParams.toString())
                if (val && val !== 'All') params.set('gender', val)
                else params.delete('gender')
                params.delete('page')
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
              }}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value='All'>All Genders</MenuItem>
              <MenuItem value='male'>Male</MenuItem>
              <MenuItem value='female'>Female</MenuItem>
            </CustomTextField>
          </div>

          <div className='flex items-center gap-4 flex-wrap'>
            <DebouncedInput
              value={searchQuery}
              onChange={value => {
                const params = new URLSearchParams(searchParams.toString())
                if (value.trim()) params.set('search', value)
                else params.delete('search')
                params.delete('page')
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
              }}
              placeholder='Search By Listener, User, Unique Id, Email'
              className='max-sm:is-full min-w-[330px]'
            />

            {/* Date Range Picker */}
            <DateRangePicker
              buttonText={
                searchParams.get('startDate') && searchParams.get('endDate')
                  ? `${searchParams.get('startDate')} - ${searchParams.get('endDate')}`
                  : 'Date Range'
              }
              buttonStartIcon={<FilterListIcon />}
              setAction={setDateRange}
              initialStartDate={searchParams.get('startDate') ? new Date(urlStartDate) : null}
              initialEndDate={searchParams.get('endDate') ? new Date(urlEndDate) : null}
              showClearButton={!!(searchParams.get('startDate') && searchParams.get('endDate'))}
              onClear={() => {
                dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
                dispatch(setPage(1))
                const params = new URLSearchParams(searchParams.toString())
                params.delete('startDate')
                params.delete('endDate')
                params.delete('page')
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
                params.delete('page')
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
              }}
            />

            <Tooltip title={isFilterActive ? 'Reset Filters' : 'No filters applied'}>
              <span>
                <Fab
                  color={isFilterActive ? 'primary' : 'default'}
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
        </Box>

        {initialLoad || loading ? (
          <Box className='flex justify-center items-center py-10 h-[60vh] '>
            <CircularProgress />
          </Box>
        ) : (
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className='border-b'>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className='px-4 py-2 text-left'
                        style={{ width: header.column.columnDef.meta?.width }}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {applications.length === 0
                  ? // <tr style={{ borderBottom: 'none' }}>
                    //   <td colSpan={columns.length} className='text-center py-4'>
                    //     No applications found
                    //   </td>
                    // </tr>
                    ''
                  : table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} style={{ width: cell.column.columnDef.meta?.width }} className='px-4 py-3'>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}

                <EmprtyTableRow
                  limit={9}
                  data={applications}
                  columns={columns}
                  noDataLebel={' No applications found'}
                />
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
      <ConfirmationDialog
        open={confirmDelete.open}
        setOpen={val => setConfirmDelete({ open: val, data: null, type: null })}
        type='approve-request'
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ open: false, data: null, type: null })}
        onClose={() => setConfirmDelete({ open: false, data: null, type: null })}
      />
      <ReqReasonDialog open={openDialog} onClose={() => setOpenDialog(false)} data={selectedData} />
      <ReqViewDialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} data={selectedData} />
    </>
  )
}

export default ListenerRequestTable
