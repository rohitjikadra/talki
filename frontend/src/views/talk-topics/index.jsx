'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'

import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'
import Box from '@mui/material/Box'
import { toast } from 'react-toastify'

import { fetchTalkTopics, deleteTalkTopic, setPage, setPageSize } from '@/redux-store/slices/talkTopics'
import tableStyles from '@core/styles/table.module.css'
import { formatDateTime } from '@/utils/format'
import CustomTextField from '@/@core/components/mui/TextField'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'

import TalkTopicDialog from './TalkTopicDialog'

import TablePaginationComponent from '@/components/TablePaginationComponent'
import EmprtyTableRow from '@/components/common/EmprtyTableRow'

const columnHelper = createColumnHelper()

const formatDate = dateString => {
  return formatDateTime(dateString)
}

const TalkTopics = () => {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const { talkTopics, initialLoading, loading, error, page, pageSize, total } = useSelector(
    state => state.talkTopicsReducer
  )

  const { profileData } = useSelector(state => state.adminSlice)



  const [openDialog, setOpenDialog] = useState(false)
  const [selectedTalkTopic, setSelectedTalkTopic] = useState(null)
  const [mode, setMode] = useState('create')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const urlPage = parseInt(searchParams.get('page') || '1')
  const urlPageSize = parseInt(searchParams.get('pageSize') || '10')

  useEffect(() => {
    dispatch(fetchTalkTopics({ page: urlPage, pageSize: urlPageSize }))
  }, [dispatch, urlPage, urlPageSize])

  // Client-side paginated data
  // const paginatedData = useMemo(() => {
  //   const start = (page - 1) * pageSize
  //   const end = start + pageSize

  //   return talkTopics.slice(start, end)
  // }, [talkTopics, page, pageSize])

  const handleOpenDeleteDialog = talkTopic => {
    setSelectedTalkTopic(talkTopic)
    setConfirmOpen(true)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor(row => row.name, {
        id: 'name',
        header: 'Topic Name',
        cell: ({ getValue }) => <Typography>{getValue() || '-'}</Typography>
      }),
      columnHelper.accessor(row => row.createdAt, {
        id: 'createdAt',
        header: 'Created At',
        cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
      }),
      columnHelper.accessor(row => row.updatedAt, {
        id: 'updatedAt',
        header: 'Updated At',
        cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex gap-2'>
            <Tooltip title="Edit Talk Topic" placement="top"><IconButton
              onClick={() => {
                setSelectedTalkTopic(row.original)
                setMode('edit')
                setOpenDialog(true)
              }}
            >
              <i className='tabler-edit text-primary' />
            </IconButton></Tooltip>
            <Tooltip title="Delete Talk Topic" placement="top"><IconButton
              onClick={() => {
                handleOpenDeleteDialog(row.original)
              }}
            >
              <i className='tabler-trash text-error' />
            </IconButton></Tooltip>
          </div>
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data: talkTopics,
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
  }

  const handlePageChange = newPage => {
    dispatch(setPage(newPage))
    updateUrlPagination(newPage, searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize'), 10) : pageSize)
  }

  return (
    <>
      <Box className='mb-3'>
        <Typography variant='h4'>
          Talk Topic
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Create and manage conversation topics to organize user–listener interactions.
        </Typography>
      </Box>

      <Card className=''>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 gap-4'>
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
          <Button
            className='sm:w-auto w-full'
            variant='contained'
            onClick={() => {
              setMode('create')
              setSelectedTalkTopic(null)
              setOpenDialog(true)
            }}
          >
            + Create Talk Topic
          </Button>
        </div>

        {initialLoading ? (
          <div className='flex justify-center items-center gap-2 my-10 h-[55vh]'>
            <CircularProgress />
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {talkTopics.length === 0
                    ? // <tr>
                    //   <td colSpan={columns.length} className='text-center py-6'>
                    //     No Talk Topics Found
                    //   </td>
                    // </tr>
                    ''
                    : table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}
                  <EmprtyTableRow limit={9} data={talkTopics} columns={columns} noDataLebel={'No Talk Topics Found'} />
                </tbody>
              </table>
            </div>

            <TablePaginationComponent
              page={searchParams.get('page') ? parseInt(searchParams.get('page'), 10) : page}
              pageSize={searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize'), 10) : pageSize}
              total={total}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </Card>

      {/* Dialogs */}
      <TalkTopicDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        mode={mode}
        talkTopic={selectedTalkTopic}
      />

      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-talk-topic'
        onConfirm={() => {
          

          dispatch(deleteTalkTopic(selectedTalkTopic._id))
        }}
        loading={loading}
        error={error}
        onClose={() => {
          setConfirmOpen(false)
        }}
      />
    </>
  )
}

export default TalkTopics
