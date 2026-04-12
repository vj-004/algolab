import { getAllProblems } from '@/modules/problems/actions';
import { deleteProblem } from '@/modules/problems/actions';
import ProblemsTable from '@/modules/problems/components/ProblemsTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { currentUserRole } from '@/modules/auth/action';
import { userRoles } from '@/constants';

const ProblemsPage = async () => {
  const userRole = await currentUserRole();
  const isAdmin = userRole === userRoles.ADMIN;

  const handleDeleteProblem = async (problemId) => {
    'use server';
    await deleteProblem(problemId);
  };

  const { data: problems = [], error } = await getAllProblems();

  if (error) {
    return (
      <section className='mx-auto flex h-full w-full max-w-6xl flex-1 flex-col gap-4 overflow-hidden px-4 py-4 md:gap-6 md:py-6'>
        <Alert variant='destructive'>
          <AlertTitle>Unable to load problems</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className='mx-auto flex h-full w-full max-w-6xl flex-1 flex-col gap-4 overflow-hidden px-4 py-4 md:gap-6 md:py-6'>
      <ProblemsTable problems={problems} isAdmin={isAdmin} onDeleteProblem={handleDeleteProblem} />
    </section>
  );
};

export default ProblemsPage;