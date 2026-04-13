import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ProblemWorkspace from '@/modules/problems/components/ProblemWorkspace';
import { getProblemById } from '@/modules/problems/actions';

const ProblemPage = async ({ params }) => {
  const { id } = await params;
  const { data: problem, error } = await getProblemById(id);

  if (error || !problem) {
    return (
      <section className='mx-auto flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden px-3 pt-3 pb-5 lg:w-4/5'>
        <Alert variant='destructive'>
          <AlertTitle>Problem not found</AlertTitle>
          <AlertDescription>{error || 'Unable to load this problem.'}</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className='mx-auto flex h-full w-full flex-1 flex-col overflow-hidden px-3 pt-3 pb-5 lg:w-4/5'>
      <ProblemWorkspace problem={problem} />
    </section>
  );
};

export default ProblemPage;