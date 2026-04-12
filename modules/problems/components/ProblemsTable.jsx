'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const difficultyOptions = ['ALL', 'EASY', 'MEDIUM', 'HARD'];

const PAGE_SIZE = 10;

const titleCase = (value) => {
  if (!value) {
    return '';
  }

  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeTag = (tag) => tag?.toString().trim();

const getDifficultyBadgeVariant = (difficulty) => {
  if (difficulty === 'EASY') {
    return 'secondary';
  }

  if (difficulty === 'MEDIUM') {
    return 'outline';
  }

  if (difficulty === 'HARD') {
    return 'destructive';
  }

  return 'default';
};

const ProblemsTable = ({ problems = [], isAdmin = false, onDeleteProblem }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const availableTags = useMemo(() => {
    const tags = new Set();

    for (const problem of problems) {
      for (const tag of problem.tags ?? []) {
        const normalized = normalizeTag(tag);
        if (normalized) {
          tags.add(normalized);
        }
      }
    }

    return ['ALL', ...Array.from(tags).sort((a, b) => a.localeCompare(b))];
  }, [problems]);

  const filteredProblems = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return problems.filter((problem) => {
      const title = problem.title?.toLowerCase() ?? '';
      const description = problem.description?.toLowerCase() ?? '';
      const tags = (problem.tags ?? []).map((tag) => tag.toLowerCase());

      const matchesSearch =
        !loweredQuery ||
        title.includes(loweredQuery) ||
        description.includes(loweredQuery) ||
        tags.some((tag) => tag.includes(loweredQuery));

      const matchesDifficulty =
        selectedDifficulty === 'ALL' || problem.difficulty === selectedDifficulty;

      const matchesTag =
        selectedTag === 'ALL' || (problem.tags ?? []).some((tag) => tag === selectedTag);

      return matchesSearch && matchesDifficulty && matchesTag;
    });
  }, [problems, query, selectedDifficulty, selectedTag]);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / PAGE_SIZE));

  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProblems.slice(start, start + PAGE_SIZE);
  }, [filteredProblems, currentPage]);

  const startItemIndex = filteredProblems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItemIndex = Math.min(currentPage * PAGE_SIZE, filteredProblems.length);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedDifficulty('ALL');
    setSelectedTag('ALL');
    setCurrentPage(1);
  };

  const onChangeQuery = (event) => {
    setQuery(event.target.value);
    setCurrentPage(1);
  };

  const onChangeDifficulty = (value) => {
    setSelectedDifficulty(value);
    setCurrentPage(1);
  };

  const onChangeTag = (value) => {
    setSelectedTag(value);
    setCurrentPage(1);
  };

  const handleDelete = (problemId) => {
    if (!onDeleteProblem) {
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this problem?');
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      setDeletingId(problemId);
      await onDeleteProblem(problemId);
      router.refresh();
      setDeletingId(null);
    });
  };

  return (
    <Card className='border-neutral-200 bg-white/90'>
      <CardHeader className='gap-3'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <CardTitle className='text-xl text-neutral-900'>Problem Set</CardTitle>
            <CardDescription>
              Browse, filter, and search through all available coding problems.
            </CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='outline'>Total: {problems.length}</Badge>
            <Badge variant='secondary'>Filtered: {filteredProblems.length}</Badge>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4'>
          <div className='relative lg:col-span-2'>
            <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400' />
            <Input
              value={query}
              onChange={onChangeQuery}
              placeholder='Search by title, description, or tags'
              className='pl-9'
            />
          </div>

          <Select value={selectedDifficulty} onValueChange={onChangeDifficulty}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Difficulty' />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((difficulty) => (
                <SelectItem key={difficulty} value={difficulty}>
                  {titleCase(difficulty)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTag} onValueChange={onChangeTag}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Tag' />
            </SelectTrigger>
            <SelectContent>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {titleCase(tag)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant='outline' onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className='overflow-x-auto rounded-2xl border border-neutral-200'>
          <table className='w-full min-w-205 border-collapse bg-white'>
            <thead className='bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500'>
              <tr>
                <th className='px-4 py-3 text-left'>Problem</th>
                <th className='px-4 py-3 text-left'>Difficulty</th>
                <th className='px-4 py-3 text-left'>Tags</th>
                {isAdmin && <th className='px-4 py-3 text-left'>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedProblems.map((problem) => {
                return (
                  <tr
                    key={problem.id}
                    className='border-t border-neutral-100 align-top transition-colors hover:bg-neutral-50/80'
                  >
                    <td className='px-4 py-3'>
                      <p className='max-w-80 truncate font-medium text-neutral-900 text-wrap' title={problem.title}>
                        {problem.title}
                      </p>
                      {/* <p className='mt-1 line-clamp-2 text-sm text-neutral-600'>{problem.description}</p> */}
                    </td>
                    <td className='px-4 py-3'>
                      <Badge variant={getDifficultyBadgeVariant(problem.difficulty)}>
                        {titleCase(problem.difficulty)}
                      </Badge>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex flex-wrap gap-1.5'>
                        {(problem.tags ?? []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant='outline'>
                            {tag}
                          </Badge>
                        ))}
                        {(problem.tags ?? []).length > 3 && (
                          <Badge variant='ghost'>+{(problem.tags ?? []).length - 3}</Badge>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className='px-4 py-3'>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => handleDelete(problem.id)}
                          disabled={isPending && deletingId === problem.id}
                        >
                          {isPending && deletingId === problem.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {paginatedProblems.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className='px-4 py-10 text-center text-sm text-neutral-500'>
                    No problems matched your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <p className='text-sm text-neutral-600'>
            Showing {startItemIndex}-{endItemIndex} of {filteredProblems.length}
          </p>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className='size-4' />
              Prev
            </Button>

            <span className='text-sm text-neutral-600'>
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant='outline'
              size='sm'
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProblemsTable;
