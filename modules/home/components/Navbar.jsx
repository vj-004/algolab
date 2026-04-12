import Link from 'next/link'
import React from 'react'

import { userRoles } from '@/constants'
import { Button } from '@/components/ui/button'
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import Image from 'next/image'

const navLinks = [
  { label: 'Problems', href: '/problems' },
  { label: 'About', href: '/about' },
  { label: 'Profile', href: '/profile' },
]

const Navbar = async ({ userRole }) => {

  const user = await currentUser();

  return (
    <header className='w-full border-b border-neutral-200 bg-transparent backdrop-blur-xs'>
      <div className='mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4'>
        <Link href='/' className='flex items-center '>
          <Image src={'/algolab_tp.png'} alt='logo' width={120} height={60} />
          <span className='text-2xl font-semibold font-mono text-neutral-800 -ml-8'>Algo<span className='text-blue-700'>Lab</span></span>
        </Link>

        <nav className='flex items-center gap-5 text-sm font-medium text-neutral-600'>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className='transition-colors hover:text-neutral-900'>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className='flex items-center justify-center gap-2'>
          {
            !user && (
                <div className='flex gap-4'>
                <div>
                <SignInButton mode='modal'>
                    <Button variant='outline' size='sm'>Sign In</Button>
                </SignInButton>
                </div>

                <div>
                <SignUpButton mode='modal'>
                    <Button variant='outline' size='sm'>Sign Up</Button>
                </SignUpButton>
                </div>
            </div>
            ) 
          }

          <div className='flex items-center gap-4'>
            {user && userRole === userRoles.ADMIN && (
              <Button asChild size='sm' variant='outline'>
                <Link href='/create-problem'>Create Problem</Link>
              </Button>
            )}

            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar