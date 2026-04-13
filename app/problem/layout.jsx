import { currentUserRole } from '@/modules/auth/action';
import Navbar from '@/modules/home/components/Navbar';

const ProblemLayout = async ({ children }) => {
  const userRole = await currentUserRole();

  return (
    <main className='relative flex h-screen flex-col overflow-hidden'>
      <Navbar userRole={userRole} />
      <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
        <div className='absolute inset-0 -z-10 h-full w-full bg-[#FFFFFF] bg-[url("/textures/grid-me.png")] bg-repeat' />
        {children}
      </div>
    </main>
  );
};

export default ProblemLayout;
