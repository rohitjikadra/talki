'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useDispatch, useSelector } from 'react-redux'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { toast } from 'react-toastify'

import CustomAvatar from '@/@core/components/mui/Avatar'
import CustomTextField from '@/@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'

import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import EmprtyTableRow from '@/components/common/EmprtyTableRow'
import TablePaginationComponent from '@/components/TablePaginationComponent'

import {
  deleteLanguage,
  downloadTranslationsCSV,
  fetchLanguages,
  setPage,
  setPageSize,
  setSearchQuery,
  toggleLanguageSwitch
} from '@/redux-store/slices/languages'

import { getFullImageUrl } from '@/utils/commonfunctions'
import { formatDateTime } from '@/utils/format'
import { getInitials } from '@/utils/getInitials'

import LanguageDialog from './LanguageDialog'
import TranslationsDialog from './TranslationsDialog'
import UploadCSVDialog from './UploadCSVDialog'

const columnHelper = createColumnHelper()

// ── Debounced Search Input ─────────────────────────────────────────────────────
const DebouncedInput = ({ value: initialValue, onChange, ...props }) => {
  const [value, setValue] = useState(initialValue)
  const timerRef = useRef(null)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleChange = e => {
    const newVal = e.target.value

    setValue(newVal)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(newVal), 400)
  }

  return <TextField size='small' {...props} value={value} onChange={handleChange} />
}

// ── Main Component ─────────────────────────────────────────────────────────────
const LanguagesView = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { languages, total, page, pageSize, initialLoading, loading, downloadLoading, error } = useSelector(
    state => state.languages
  )

  const { profileData } = useSelector(state => state.adminSlice)


  // ── URL params ───────────────────────────────────────────────────────────
  const urlPage = parseInt(searchParams.get('page') || '1', 10)
  const urlPageSize = parseInt(searchParams.get('pageSize') || '10', 10)
  const urlSearch = searchParams.get('search') || ''

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [langDialogOpen, setLangDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [translationsDialogOpen, setTranslationsDialogOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmDownloadOpen, setConfirmDownloadOpen] = useState(false)

  const [selectedLanguage, setSelectedLanguage] = useState(null)

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchLanguages({ page: urlPage, pageSize: urlPageSize, search: urlSearch }))
  }, [dispatch, urlPage, urlPageSize, urlSearch])

  // ── URL helpers ──────────────────────────────────────────────────────────
  const updateUrl = params => {
    const p = new URLSearchParams(searchParams.toString())

    Object.entries(params).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') p.delete(k)
      else p.set(k, String(v))
    })
    router.replace(`${pathname}?${p.toString()}`, { scroll: false })
  }

  const handlePageSizeChange = e => {
    const newSize = parseInt(e.target.value, 10)

    dispatch(setPageSize(newSize))
    dispatch(setPage(1))
    updateUrl({ pageSize: newSize === 10 ? null : newSize, page: null })
  }

  const handlePageChange = newPage => {
    dispatch(setPage(newPage))
    updateUrl({ page: newPage === 1 ? null : newPage })
  }

  const handleSearchChange = value => {
    dispatch(setSearchQuery(value))
    dispatch(setPage(1))
    updateUrl({ search: value || null, page: null })
  }

  // ── Toggle switch ────────────────────────────────────────────────────────
  const handleToggle = (languageCode, toggleType) => {


    dispatch(toggleLanguageSwitch({ languageCode, toggleType }))
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteConfirm = () => {
    

    if (selectedLanguage) {
      dispatch(deleteLanguage(selectedLanguage.languageCode))
    }
  }

  // ── Download CSV ─────────────────────────────────────────────────────────
  const handleDownload = () => {
    setConfirmDownloadOpen(true)
  }

  const handleConfirmDownload = () => {
    dispatch(downloadTranslationsCSV())
  }

  // ── Active languages for upload dialog ───────────────────────────────────
  const activeLanguages = useMemo(() => languages.filter(l => l.isActive), [languages])

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'srNo',
        header: 'Sr. No',
        cell: ({ row }) => <Typography>{(urlPage - 1) * urlPageSize + row.index + 1}</Typography>
      }),

      columnHelper.accessor('languageIcon', {
        header: 'Icon',
        cell: ({ getValue, row }) => {
          const src = getFullImageUrl(getValue())

          return src ? (
            <CustomAvatar variant='rounded' src={src} size={40} />
          ) : (
            <CustomAvatar variant='rounded' size={40}>
              {getInitials(row.original.languageTitle || '?')}
            </CustomAvatar>
          )
        }
      }),

      columnHelper.accessor('languageTitle', {
        header: 'Title',
        cell: ({ getValue }) => (
          <Typography fontWeight={500} color='text.primary'>
            {getValue() || '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('languageCode', {
        header: 'Code',
        cell: ({ getValue }) => (
          <Typography variant='body2' color='text.secondary' className='uppercase'>
            {getValue() || '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('localLanguageTitle', {
        header: 'Localized Title',
        cell: ({ getValue }) => <Typography>{getValue() || '-'}</Typography>
      }),

      columnHelper.accessor('isActive', {
        header: 'Active',
        cell: ({ getValue, row }) => (
          <Switch checked={!!getValue()} onChange={() => handleToggle(row.original.languageCode, 1)} size='small' />
        )
      }),

      columnHelper.accessor('isDefault', {
        header: 'Default',
        cell: ({ getValue, row }) => (
          <Switch checked={!!getValue()} onChange={() => handleToggle(row.original.languageCode, 2)} size='small' />
        )
      }),

      columnHelper.accessor('errorCount', {
        header: 'Errors',
        cell: ({ getValue }) => <Typography>{getValue() ?? 0}</Typography>
      }),

      columnHelper.accessor('createdAt', {
        header: 'Created At',
        cell: ({ getValue }) => (
          <Typography variant='body2' noWrap>
            {formatDateTime(getValue()) || '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('updatedAt', {
        header: 'Updated At',
        cell: ({ getValue }) => (
          <Typography variant='body2' noWrap>
            {formatDateTime(getValue()) || '-'}
          </Typography>
        )
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            {/* View Translations */}
            <Tooltip title='View Translations'>
              <IconButton
                size='small'
                onClick={() => {
                  setSelectedLanguage(row.original)
                  setTranslationsDialogOpen(true)
                }}
              >
                <i className='tabler-eye text-textSecondary' />
              </IconButton>
            </Tooltip>

            {/* Edit */}
            <Tooltip title='Edit Language' placement='top'>
              <IconButton
                size='small'
                onClick={() => {
                  setSelectedLanguage(row.original)
                  setLangDialogOpen(true)
                }}
              >
                <i className='tabler-edit text-primary' />
              </IconButton>
            </Tooltip>

            {/* Delete */}
            <Tooltip title='Delete Language' placement='top'>
              <IconButton
                size='small'
                onClick={() => {
                  setSelectedLanguage(row.original)
                  setConfirmDeleteOpen(true)
                }}
              >
                <i className='tabler-trash text-error' />
              </IconButton>
            </Tooltip>
          </div>
        )
      })
    ],
    [urlPage, urlPageSize, languages]
  )

  const table = useReactTable({
    data: languages,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Page Header */}
      <Box className='mb-4'>
        <Typography variant='h4'>App Languages</Typography>
        <Typography variant='body2' color='text.secondary'>
          Manage application languages and translations.
        </Typography>
      </Box>

      <Card>
        {/* Toolbar */}
        <Box className='flex flex-wrap justify-between items-center gap-4 p-6'>
          {/* Left: page-size + search */}
          <Box className='flex items-center gap-4 flex-wrap'>
            <CustomTextField
              select
              value={searchParams.get('pageSize') || 10}
              onChange={handlePageSizeChange}
              className='max-sm:is-full sm:is-[80px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
              <MenuItem value='100'>100</MenuItem>
            </CustomTextField>
          </Box>

          {/* Right: actions */}
          <Box className='flex items-center gap-3 flex-wrap'>
            <DebouncedInput
              value={urlSearch}
              onChange={handleSearchChange}
              placeholder='Search with Code, Title and Local Title'
              className='min-w-[320px]'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-search text-textSecondary' />
                  </InputAdornment>
                )
              }}
            />

            <Button
              variant='outlined'
              startIcon={downloadLoading ? <CircularProgress size={16} /> : <i className='tabler-download' />}
              onClick={handleDownload}
              disabled={downloadLoading}
            >
              {downloadLoading ? 'Downloading...' : 'Download File'}
            </Button>

            <Button
              variant='outlined'
              startIcon={<i className='tabler-upload' />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload File
            </Button>

            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => {
                setSelectedLanguage(null)
                setLangDialogOpen(true)
              }}
            >
              Add Language
            </Button>
          </Box>
        </Box>

        {/* Table */}
        <div className='overflow-x-auto'>
          {initialLoading ? (
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
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className={tableStyles.tableBodyCell}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                <EmprtyTableRow
                  limit={columns.length}
                  data={languages}
                  columns={columns}
                  noDataLebel='No languages found'
                />
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <TablePaginationComponent page={urlPage} pageSize={urlPageSize} total={total} onPageChange={handlePageChange} />
      </Card>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      {/* Add / Edit Language */}
      <LanguageDialog
        open={langDialogOpen}
        onClose={() => {
          setLangDialogOpen(false)
          setSelectedLanguage(null)
        }}
        language={selectedLanguage}
      />

      {/* Upload CSV */}
      <UploadCSVDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        activeLanguages={activeLanguages}
      />

      {/* View / Edit Translations */}
      <TranslationsDialog
        open={translationsDialogOpen}
        onClose={() => {
          setTranslationsDialogOpen(false)
          setSelectedLanguage(null)
        }}
        language={selectedLanguage}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={confirmDeleteOpen}
        setOpen={setConfirmDeleteOpen}
        type='delete-language'
        title='Are you sure you want to delete this language?'
        content='This will also delete all translations for this language. This action cannot be undone.'
        onConfirm={handleDeleteConfirm}
        onClose={() => setConfirmDeleteOpen(false)}
        loading={loading}
        error={error}
      />

      {/* Download Confirmation */}
      <ConfirmationDialog
        open={confirmDownloadOpen}
        setOpen={setConfirmDownloadOpen}
        type='download-translations'
        title='Download All Translations?'
        content='This will generate and download a CSV file containing all translations for all active languages.'
        onConfirm={handleConfirmDownload}
        onClose={() => setConfirmDownloadOpen(false)}
        loading={downloadLoading}
        error={error}
        confirmButtonText='Yes, Download'
      />
    </Box>
  )
}

export default LanguagesView
