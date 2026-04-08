import { userRoles } from '@/constants';
import { currentUserRole } from '@/modules/auth/action';
import Navbar from '@/modules/home/components/Navbar';
import { redirect } from 'next/navigation';
import React from 'react'
import CreateProblemForm from './_components/CreateProblemForm';

const CreateProblemPage = async () => {

    const userRole = await currentUserRole();

    if(userRole !== userRoles.ADMIN){
        return redirect('/');
    }

  return (
    <main className='relative flex min-h-screen flex-col overflow-hidden'>
      <Navbar userRole={userRole} />
      <div className='relative flex min-h-0 flex-1 flex-col overflow-y-auto'>
        <div className='absolute inset-0 -z-10 h-full w-full bg-[#FFFFFF] bg-[url("/textures/grid-me.png")] bg-repeat'></div>
        <CreateProblemForm />
      </div>
    </main>
  )
}

export default CreateProblemPage