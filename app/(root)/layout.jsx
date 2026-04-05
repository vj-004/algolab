import { userRoles } from '@/constants'
import { currentUserRole } from '@/modules/auth/action'
import Navbar from '@/modules/home/components/Navbar'
import React from 'react'

const RootLayout = async ({children}) => {

  const userRole = await currentUserRole();

  return (
    <main className='relative flex h-screen flex-col overflow-hidden'>
        {/* Navbar */}
        <Navbar userRole={userRole}/>
        <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
          <div className='absolute inset-0 h-full w-full -z-10 bg-[#FFFFFF] bg-[url("/textures/grid-me.png")] bg-repeat'></div>
          {children}
        </div>
    </main>
  )
}

export default RootLayout