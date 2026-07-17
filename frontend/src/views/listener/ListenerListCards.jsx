import { useMemo } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import { useSelector } from 'react-redux'

import HorizontalWithSubtitle from '@components/card-statistics/HorizontalWithSubtitle'

const ListenerListCards = ({ states, total, userCount, personType = 'listener' }) => {
  console.log('userCount: ', userCount);
  // Get current user type
  const { type, data: reduxData } = useSelector(state => state.userReducer)
  console.log('type: ', type);

  // Vars
  const cardData = useMemo(() => {
    // Default data for regular and fake users
      return [
        {
          title: `Total ${personType}s`,
          stats: userCount?.activeListeners || 0,
          avatarIcon: 'tabler-user-check',
          avatarColor: 'success',
          trend: 'negative',

          // trendNumber: '14%',
          subtitle: 'Last week analytics'
        },
        {
          title: 'Males',
          stats: userCount?.maleListeners || 0,
          avatarIcon: 'tabler-gender-male',
          avatarColor: 'primary',
          trend: 'positive',

          // trendNumber: '29%',
          subtitle: 'Total User'
        },
        {
          title: 'Females',
          stats: userCount?.femaleListeners || 0,
          avatarIcon: 'tabler-gender-female',
          avatarColor: 'error',
          trend: 'positive',

          // trendNumber: '18%',
          subtitle: 'Last week analytics'
        }

        // {
        //   title: `VIP ${personType}s`,
        //   stats: userCount?.vipUsers || 0,
        //   avatarIcon: 'tabler-users',
        //   avatarColor: 'warning',
        //   trend: 'positive',

        //   // trendNumber: '42%',
        //   subtitle: 'Last week analytics'
        // }
      ]
  }, [userCount, reduxData, personType])

  return (
    <Grid container spacing={6} sx={{marginBottom : 5}}>
      {cardData.map((item, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
          <HorizontalWithSubtitle {...item} />
        </Grid>
      ))}
    </Grid>
  )
}

export default ListenerListCards
