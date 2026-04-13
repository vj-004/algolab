"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import ProblemWorkspace from '@/modules/problems/components/ProblemWorkspace';

const InterviewSessionPage = () => {
  const searchParams = useSearchParams();
  const code = (searchParams.get('code') || '').trim();
  const canSeedInitialCode = searchParams.get('host') === '1';

  const [session, setSession] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeProblemId, setActiveProblemId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSession = async () => {
      if (!code) {
        setError('Session code is missing.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const sessionResponse = await fetch(`/api/interview-sessions?code=${encodeURIComponent(code)}`, {
          cache: 'no-store',
        });
        const sessionPayload = await sessionResponse.json();

        if (!sessionResponse.ok || !sessionPayload?.success) {
          throw new Error(sessionPayload?.error || 'Unable to find this interview session.');
        }

        const problemIds = sessionPayload?.data?.problemIds || [];

        const problemsResponse = await fetch(
          `/api/problems?ids=${encodeURIComponent(problemIds.join(','))}&details=1`,
          { cache: 'no-store' }
        );
        const problemsPayload = await problemsResponse.json();

        if (!problemsResponse.ok || !problemsPayload?.success) {
          throw new Error(problemsPayload?.error || 'Unable to load interview problems.');
        }

        const loadedProblems = Array.isArray(problemsPayload.data) ? problemsPayload.data : [];

        setSession(sessionPayload.data);
        setProblems(loadedProblems);
        setActiveProblemId(loadedProblems[0]?.id || '');
      } catch (err) {
        setError(err.message || 'Failed to load interview session.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [code]);

  const activeProblem = useMemo(
    () => problems.find((problem) => problem.id === activeProblemId) || problems[0] || null,
    [activeProblemId, problems]
  );

  if (isLoading) {
    return (
      <section className='mx-auto flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden px-3 pt-3 pb-5 lg:w-4/5'>
        <Card className='border border-neutral-300 p-6 text-sm text-neutral-600 shadow-sm'>Loading interview session...</Card>
      </section>
    );
  }

  if (error || !session || !activeProblem) {
    return (
      <section className='mx-auto flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden px-3 pt-3 pb-5 lg:w-4/5'>
        <Alert variant='destructive'>
          <AlertTitle>Unable to open interview</AlertTitle>
          <AlertDescription>{error || 'No interview data available.'}</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className='mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden px-3 pt-3 pb-5 lg:w-4/5'>
      <Card className='shrink-0 gap-2 border border-neutral-300 px-4 py-3 shadow-sm'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h1 className='text-base font-semibold text-neutral-900'>Interview Session: {session.code}</h1>
          <p className='text-xs text-neutral-500'>Choose a problem from the navigation below.</p>
        </div>

        <div className='flex flex-wrap gap-2'>
          {problems.map((problem, index) => (
            <button
              key={problem.id}
              type='button'
              onClick={() => setActiveProblemId(problem.id)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                problem.id === activeProblem.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Problem {index + 1}
            </button>
          ))}
        </div>
      </Card>

      <div className='min-h-0 flex-1'>
        <ProblemWorkspace
          problem={activeProblem}
          hideMeta
          useSharedEditor
          sharedRoomId={session.code}
          isInterviewSession
          allowSharedInitialSeed={canSeedInitialCode}
        />
      </div>
    </section>
  );
};

export default InterviewSessionPage;
