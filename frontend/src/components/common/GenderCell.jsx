import Typography from '@mui/material/Typography'

const GenderCell = ({ gender }) => {
    const iconClass =
        gender === 'male'
            ? 'tabler-gender-male'
            : gender === 'female'
                ? 'tabler-gender-female'
                : ''

    return (
        <Typography
            textTransform="capitalize"
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
            {iconClass && <i className={iconClass} />}
            {gender || '-'}
        </Typography>
    )
}

export default GenderCell
