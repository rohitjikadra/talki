'use client'

// React Imports
import { useState, useMemo, useEffect, useRef } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import { styled } from '@mui/material/styles'
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'
import DateRangePicker from '@/components/common/DateRangePicker'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Redux Imports
import { useDispatch, useSelector } from 'react-redux'
import { fetchCoinPurchaseHistory, setDateRange, setSearchQuery } from '@/redux-store/slices/coinPlanHistory'

// Styled Components
const Icon = styled('i')({})

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

const userStatusObj = {
    active: 'success',
    pending: 'warning',
    inactive: 'secondary'
}

// Column Definitions
const columnHelper = createColumnHelper()

const ViewRecords = ({ userId }) => {
    // Redux state
    const dispatch = useDispatch()
    const { coinhistory, dateRange } = useSelector(state => state.coinPlanHistory)
    const { data, loading, initialLoading, total, page, pageSize } = coinhistory

    // Hooks
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const [resetKey, setResetKey] = useState(0)

    // Initialize from URL params
    const urlPage = parseInt(searchParams.get('page')) || 1
    const urlPageSize = parseInt(searchParams.get('pageSize')) || 20
    const urlStartDate = searchParams.get('startDate') || 'All'
    const urlEndDate = searchParams.get('endDate') || 'All'
    const urlSearch = searchParams.get('search') || ''

    // Fetch data on mount and when params change
    useEffect(() => {
        if (userId) {
            dispatch(fetchCoinPurchaseHistory({
                userId,
                start: urlPage,
                limit: urlPageSize,
                startDate: urlStartDate,
                endDate: urlEndDate,
                search: urlSearch
            }))
        }
    }, [dispatch, userId, urlPage, urlPageSize, urlStartDate, urlEndDate, urlSearch])

    // Check if any filter is active
    const isFilterActive = useMemo(() => {
        return (
            urlSearch?.trim() ||
            searchParams.get('startDate') ||
            searchParams.get('endDate') ||
            urlPage !== 1 ||
            urlPageSize !== 20
        )
    }, [urlSearch, searchParams, urlPage, urlPageSize])

    // Handle reset filters
    const handleResetFilters = () => {
        // Reset search query
        dispatch(setSearchQuery(''))
        setResetKey(prev => prev + 1) // Force re-render of DebouncedInput to clear input

        // Reset date range
        dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))

        // Reset page to 1
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('pageSize', searchParams.get('pageSize') || '20')
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const columns = useMemo(
        () => [
            columnHelper.accessor('uniqueId', {
                header: 'Unique ID',
                cell: ({ getValue }) => <Typography>{getValue() || '-'}</Typography>
            }),
            columnHelper.accessor('paymentGateway', {
                header: 'Payment Gateway',
                cell: ({ getValue }) => <Typography>{getValue() || '-'}</Typography>
            }),
            columnHelper.accessor('userCoin', {
                header: 'User Coin',
                cell: ({ getValue }) => (
                    <div className="flex items-center gap-2">
                        <img
                            src="/images/tcoin.png"
                            alt="coin"
                            className="w-4 h-4"
                        />
                        <Typography>{`${getValue()?.toFixed(2)}`}</Typography>
                    </div>
                )
            }),
            columnHelper.accessor('price', {
                header: 'Price',
                cell: ({ getValue }) => <Typography>{`₹${getValue()?.toFixed(2) || '0.00'}`}</Typography>
            }),
            columnHelper.accessor('date', {
                header: 'Date',
                cell: ({ getValue }) => <Typography>{getValue() || '-'}</Typography>
            })
        ],
        []
    )

    const table = useReactTable({
        data: data || [],
        columns,
        manualPagination: true,
        getCoreRowModel: getCoreRowModel()
    })

    const updateUrlPagination = (page, pageSize) => {
        const params = new URLSearchParams(searchParams.toString())

        if (page !== 1) {
            params.set('page', page.toString())
        } else {
            params.delete('page')
        }

        if (pageSize !== 20) {
            params.set('pageSize', pageSize.toString())
        } else {
            params.delete('pageSize')
        }

        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const handleRowsPerPageChange = e => {
        const newPageSize = parseInt(e.target.value, 10)
        updateUrlPagination(1, newPageSize)
    }

    const handlePageChange = newPage => {
        updateUrlPagination(newPage, searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize'), 10) : pageSize)
    }

    return (
        <Card>
            <CardContent className='flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center p-6'>
                <div className='flex items-center gap-2'>
                    <Typography>Show</Typography>
                    <CustomTextField
                        select
                        value={searchParams.get('pageSize') || 20}
                        onChange={handleRowsPerPageChange}
                        className='max-sm:is-full sm:is-[80px]'
                    >
                        <MenuItem value='10'>10</MenuItem>
                        <MenuItem value='20'>20</MenuItem>
                        <MenuItem value='50'>50</MenuItem>
                        <MenuItem value='100'>100</MenuItem>
                    </CustomTextField>
                </div>
                <div className='flex gap-4 flex-col !items-start max-sm:is-full sm:flex-row sm:items-center'>
                    <DebouncedInput
                        key={resetKey}
                        resetSignal={resetKey}
                        value={searchParams.get('search') || ''}
                        placeholder='Search By Unique Id, Payment Gateway, Or Coins'
                        className='max-sm:is-full min-w-[370px]'
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
                        initialStartDate={searchParams.get('startDate') ? new Date(dateRange.startDate) : null}
                        initialEndDate={searchParams.get('endDate') ? new Date(dateRange.endDate) : null}
                        showClearButton={searchParams.get('startDate') && searchParams.get('endDate')}
                        onClear={() => {
                            dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
                            const params = new URLSearchParams(searchParams.toString())
                            params.delete('startDate')
                            params.delete('endDate')
                            params.set('page', '1')
                            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
                        }}
                        onApply={(newStartDate, newEndDate) => {
                            dispatch(setDateRange({ startDate: newStartDate, endDate: newEndDate }))
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
            </CardContent>

            <div className='overflow-x-auto'>
                {loading || initialLoading ? (
                    <div className='flex justify-center items-center p-6 h-96'>
                        <CircularProgress />
                    </div>
                ) : (
                    <table className={tableStyles.table}>
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {data && data.length > 0 ? (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className='text-center py-6'>
                                        No records found
                                    </td>
                                </tr>
                            )}
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
    )
}

export default ViewRecords


