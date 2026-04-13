"use client"

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const InterviewPage = () => {
  const router = useRouter()
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [sessionCode, setSessionCode] = useState('')
  const [availableProblems, setAvailableProblems] = useState([])
  const [selectedProblemIds, setSelectedProblemIds] = useState([])
  const [isProblemsLoading, setIsProblemsLoading] = useState(false)
  const [problemsError, setProblemsError] = useState('')
  const [joinError, setJoinError] = useState('')
  const [createError, setCreateError] = useState('')
  const [problemSearch, setProblemSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('ALL')
  const [tagFilter, setTagFilter] = useState('ALL')

  const availableDifficulties = useMemo(() => {
    const items = Array.from(new Set(availableProblems.map((problem) => problem.difficulty).filter(Boolean)))
    return items
  }, [availableProblems])

  const availableTags = useMemo(() => {
    const tags = new Set()
    availableProblems.forEach((problem) => {
      if (Array.isArray(problem.tags)) {
        problem.tags.forEach((tag) => tags.add(tag))
      }
    })
    return Array.from(tags)
  }, [availableProblems])

  const filteredProblems = useMemo(() => {
    return availableProblems.filter((problem) => {
      const matchesSearch =
        !problemSearch.trim() ||
        problem.title.toLowerCase().includes(problemSearch.trim().toLowerCase())

      const matchesDifficulty = difficultyFilter === 'ALL' || problem.difficulty === difficultyFilter

      const matchesTag =
        tagFilter === 'ALL' ||
        (Array.isArray(problem.tags) && problem.tags.includes(tagFilter))

      return matchesSearch && matchesDifficulty && matchesTag
    })
  }, [availableProblems, difficultyFilter, problemSearch, tagFilter])

  useEffect(() => {
    const loadProblems = async () => {
      if (!isCreateModalOpen) {
        return
      }

      setIsProblemsLoading(true)
      setProblemsError('')

      try {
        const response = await fetch('/api/problems', { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Unable to load problems')
        }

        setAvailableProblems(Array.isArray(payload.data) ? payload.data : [])
      } catch (error) {
        setProblemsError(error.message || 'Unable to load problems')
      } finally {
        setIsProblemsLoading(false)
      }
    }

    loadProblems()
  }, [isCreateModalOpen])

  const closeJoinModal = () => {
    setIsJoinModalOpen(false)
    setJoinError('')
  }

  const openJoinModal = () => {
    setIsJoinModalOpen(true)
    setJoinError('')
  }

  const handleJoinInterview = async () => {
    if (!sessionCode.trim()) {
      return
    }

    setJoinError('')

    try {
      const response = await fetch(`/api/interview-sessions?code=${encodeURIComponent(sessionCode.trim())}`, {
        cache: 'no-store',
      })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Unable to join this interview session')
      }

      closeJoinModal()
      router.push(`/interview/session?code=${encodeURIComponent(sessionCode.trim())}`)
    } catch (error) {
      setJoinError(error.message || 'Unable to join this interview session')
    }
  }

  const openCreateModal = () => {
    setIsCreateModalOpen(true)
    setCreateError('')
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setCreateError('')
  }

  const clearFilters = () => {
    setProblemSearch('')
    setDifficultyFilter('ALL')
    setTagFilter('ALL')
  }

  const toggleProblemSelection = (problemId) => {
    setSelectedProblemIds((prev) =>
      prev.includes(problemId) ? prev.filter((id) => id !== problemId) : [...prev, problemId]
    )
  }

  const handleCreateInterview = async () => {
    if (selectedProblemIds.length === 0) {
      return
    }

    setCreateError('')

    try {
      const response = await fetch('/api/interview-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problemIds: selectedProblemIds }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Unable to create interview session')
      }

      const code = payload?.data?.code
      closeCreateModal()

      if (code) {
        router.push(`/interview/session?code=${encodeURIComponent(code)}&host=1`)
      }
    } catch (error) {
      setCreateError(error.message || 'Unable to create interview session')
    }
  }

  return (
    <section className='relative min-h-full overflow-y-auto px-4 pb-8 pt-6 sm:px-6 lg:px-10 lg:pb-10'>
      <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.16),transparent_45%),radial-gradient(circle_at_90%_0%,rgba(249,115,22,0.14),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]' />

      <div className='mx-auto flex w-full max-w-6xl flex-col gap-6'>
        <header className='rounded-3xl border border-neutral-200 bg-white/90 px-6 py-7 shadow-sm backdrop-blur'>
          <div className='grid items-center gap-5 lg:grid-cols-[1.2fr_0.8fr]'>
            <div className='space-y-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500'>Interview Hub</p>
              <h1 className='text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl'>
                Choose How You Want To Interview
              </h1>
              <p className='max-w-xl text-sm text-neutral-600 sm:text-base'>
                Start a live coding session as an interviewer or join an existing interview with a session code.
                Everything is built for fast setup and real-time collaboration.
              </p>
            </div>
          </div>
        </header>

        <div className='grid gap-6 lg:grid-cols-2'>
          <article className='group relative overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm'>
            <div className='absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-200/45 blur-2xl transition-all duration-500 group-hover:scale-110' />
            <div className='space-y-4'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.14em] text-sky-700'>Option 1</p>
                  <h2 className='mt-1 text-2xl font-semibold text-neutral-900'>Join Interview</h2>
                </div>
                <Image src='/window.svg' alt='Join interview illustration' width={56} height={56} className='opacity-80' />
              </div>

              <p className='text-sm text-neutral-700'>
                Enter a shared session code and collaborate inside the live coding workspace with the interviewer.
              </p>

              <ul className='space-y-2 text-sm text-neutral-700'>
                <li>Real-time code sync</li>
                <li>Shared problem context</li>
                <li>Instantly connected session</li>
              </ul>

              <Button className='rounded-xl bg-sky-600 text-white hover:bg-sky-700' onClick={openJoinModal}>
                Join With Code
              </Button>
            </div>
          </article>

          <article className='group relative overflow-hidden rounded-3xl border border-orange-200 bg-linear-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm'>
            <div className='absolute -left-8 -top-8 h-28 w-28 rounded-full bg-orange-200/45 blur-2xl transition-all duration-500 group-hover:scale-110' />
            <div className='space-y-4'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.14em] text-orange-700'>Option 2</p>
                  <h2 className='mt-1 text-2xl font-semibold text-neutral-900'>Take Interview</h2>
                </div>
                <Image src='/globe.svg' alt='Take interview illustration' width={56} height={56} className='opacity-80' />
              </div>

              <p className='text-sm text-neutral-700'>
                Launch a new interview room, share the code with candidates, and evaluate solution quality in one place.
              </p>

              <ul className='space-y-2 text-sm text-neutral-700'>
                <li>Create interview room instantly</li>
                <li>Invite candidates with room code</li>
                <li>Track answers live</li>
              </ul>

              <Button className='rounded-xl bg-orange-600 text-white hover:bg-orange-700' onClick={openCreateModal}>
                Create Interview
              </Button>
            </div>
          </article>
        </div>

        <section className='grid gap-6 lg:grid-cols-[1fr_1fr]'>
          <div className='relative overflow-hidden rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm'>
            <div className='absolute inset-x-8 bottom-8 rounded-xl border border-white/30 bg-neutral-900/78 px-4 py-3 text-white backdrop-blur'>
              <p className='text-xs uppercase tracking-wide text-neutral-200'>Session Ready</p>
              <p className='text-sm font-medium'>Choose your role and start collaborating in seconds.</p>
            </div>
          </div>

          <div className='overflow-hidden rounded-3xl border border-neutral-200 bg-white/90 shadow-sm'>
            <div className='h-full w-full bg-[url("/textures/worn-dots.png")] bg-repeat p-6'>
              <div className='space-y-3 rounded-2xl border border-neutral-200 bg-white/95 p-5'>
                <h3 className='text-lg font-semibold text-neutral-900'>Interview Checklist</h3>
                <p className='text-sm text-neutral-600'>
                  Keep this flow simple and repeatable for every candidate round.
                </p>
                <ol className='space-y-2 text-sm text-neutral-700'>
                  <li>1. Choose join or take interview.</li>
                  <li>2. Open or share room code.</li>
                  <li>3. Start live coding and discussion.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isJoinModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/55 px-4 backdrop-blur-[2px]'>
          <div className='w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl'>
            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-sky-700'>Join Interview</p>
              <h3 className='text-2xl font-semibold text-neutral-900'>Enter Session Code</h3>
              <p className='text-sm text-neutral-600'>
                Paste the code shared by the interviewer to join the live coding session.
              </p>
            </div>

            <div className='mt-5 space-y-2'>
              <label htmlFor='session-code' className='text-sm font-medium text-neutral-700'>
                Session Code
              </label>
              <Input
                id='session-code'
                value={sessionCode}
                onChange={(event) => setSessionCode(event.target.value)}
                placeholder='e.g. ALGO-123456'
                className='h-11'
                autoFocus
              />
            </div>

            <div className='mt-6 flex items-center justify-end gap-3'>
              <Button type='button' variant='outline' onClick={closeJoinModal}>
                Close
              </Button>
              <Button
                type='button'
                className='bg-sky-600 text-white hover:bg-sky-700'
                disabled={!sessionCode.trim()}
                onClick={handleJoinInterview}
              >
                Join
              </Button>
            </div>

            {joinError && <p className='mt-3 text-sm text-red-600'>{joinError}</p>}
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/55 px-4 backdrop-blur-[2px]'>
          <div className='w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl'>
            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-orange-700'>Take Interview</p>
              <h3 className='text-2xl font-semibold text-neutral-900'>Select Problems For Interview</h3>
              <p className='text-sm text-neutral-600'>
                Pick one or more problems from your problem set before creating the interview room.
              </p>
            </div>

            <div className='mt-5 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-neutral-200 p-3'>
              <div className='grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[1.2fr_1fr_1fr_auto]'>
                <Input
                  value={problemSearch}
                  onChange={(event) => setProblemSearch(event.target.value)}
                  placeholder='Search by problem title'
                  className='h-10 bg-white'
                />

                <select
                  value={difficultyFilter}
                  onChange={(event) => setDifficultyFilter(event.target.value)}
                  className='h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-orange-400'
                >
                  <option value='ALL'>All difficulties</option>
                  {availableDifficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>

                <select
                  value={tagFilter}
                  onChange={(event) => setTagFilter(event.target.value)}
                  className='h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-orange-400'
                >
                  <option value='ALL'>All tags</option>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>

                <Button type='button' variant='outline' className='h-10 sm:self-start' onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>

              {isProblemsLoading && <p className='text-sm text-neutral-600'>Loading problems...</p>}

              {!isProblemsLoading && problemsError && (
                <p className='text-sm text-red-600'>{problemsError}</p>
              )}

              {!isProblemsLoading && !problemsError && availableProblems.length === 0 && (
                <p className='text-sm text-neutral-600'>No problems found. Add a problem first.</p>
              )}

              {!isProblemsLoading && !problemsError && availableProblems.length > 0 && filteredProblems.length === 0 && (
                <p className='text-sm text-neutral-600'>No problems match your current search and filters.</p>
              )}

              {!isProblemsLoading &&
                !problemsError &&
                filteredProblems.map((problem) => {
                  const isSelected = selectedProblemIds.includes(problem.id)

                  return (
                    <label
                      key={problem.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? 'border-orange-300 bg-orange-50/70'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={isSelected}
                        onChange={() => toggleProblemSelection(problem.id)}
                        className='mt-1 h-4 w-4 rounded border-neutral-300 accent-orange-600'
                      />

                      <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold text-neutral-900'>{problem.title}</p>
                        <p className='mt-1 text-xs uppercase tracking-wide text-neutral-500'>
                          {problem.difficulty}
                          {Array.isArray(problem.tags) && problem.tags.length > 0
                            ? ` • ${problem.tags.slice(0, 3).join(', ')}`
                            : ''}
                        </p>
                      </div>
                    </label>
                  )
                })}
            </div>

            <div className='mt-2 text-xs text-neutral-500'>
              {selectedProblemIds.length} problem{selectedProblemIds.length === 1 ? '' : 's'} selected
            </div>

            <div className='mt-6 flex items-center justify-end gap-3'>
              <Button type='button' variant='outline' onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button
                type='button'
                className='bg-orange-600 text-white hover:bg-orange-700'
                disabled={selectedProblemIds.length === 0}
                onClick={handleCreateInterview}
              >
                Create
              </Button>
            </div>

            {createError && <p className='mt-3 text-sm text-red-600'>{createError}</p>}
          </div>
        </div>
      )}
    </section>
  )
}

export default InterviewPage