'use client'

import React from 'react'
import ViewRecords from '@/views/coin-plan-history/ViewRecords'

const page = async ({ params }) => {

  const { userId } = await params

  return (
    <ViewRecords userId={userId} />
  )
}

export default page

