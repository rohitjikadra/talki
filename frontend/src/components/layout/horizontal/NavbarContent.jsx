'use client'

import { useState } from 'react'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import Logo from '@components/layout/shared/Logo'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'
import NotificationDialog from '@components/dialogs/NotificationDialog'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const NavbarContent = () => {
  // States
  const [notificationOpen, setNotificationOpen] = useState(false)

  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  return (
    <div
      className={classnames(horizontalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}
    >
      <div className='flex items-center gap-4'>
        <NavToggle />
        {/* Hide Logo on Smaller screens */}
        {!isBreakpointReached && <Logo />}
      </div>
      <div className='flex items-center'>
        <div className='flex items-center cursor-pointer' onClick={() => setNotificationOpen(true)}>
          <i className='tabler-bell text-[22px] text-textSecondary' />
          <span className='flex h-2 w-2 rounded-full bg-error -translate-y-2 -translate-x-1' />
        </div>
        <ModeDropdown />
        <UserDropdown />
      </div>
      <NotificationDialog open={notificationOpen} handleClose={() => setNotificationOpen(false)} />
    </div>
  )
}

export default NavbarContent