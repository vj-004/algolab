'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PlatformCodeEditor from '@/modules/problems/components/PlatformCodeEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const createTestCaseBlock = () => ({
  input: '',
  output: '',
  explanation: '',
});

const initialFormState = {
  title: '',
  difficulty: 'EASY',
  tags: '',
  description: '',
  inputFormat: '',
  outputFormat: '',
  constraints: '',
  testCaseBlocks: [
    {
      input: '5\n1 2 3 4 5',
      output: '15',
      explanation: 'Sum all numbers from the second line.',
    },
  ],
  codeSnippets: `{
  "javascript": "function solve(input) {\\n  // write code here\\n}",
  "python": "def solve(input):\\n    pass",
  "cpp": "vector<int> solve(/* input */) {\\n  return {};\\n}"
}`,
  referenceSolution: `{
  "javascript": "function solve({ nums, target }) {\\n  const seen = new Map();\\n  for (let i = 0; i < nums.length; i++) {\\n    const need = target - nums[i];\\n    if (seen.has(need)) return [seen.get(need), i];\\n    seen.set(nums[i], i);\\n  }\\n  return [];\\n}",
  "python": "def solve(data):\\n    nums, target = data['nums'], data['target']\\n    seen = {}\\n    for i, n in enumerate(nums):\\n      need = target - n\\n      if need in seen:\\n        return [seen[need], i]\\n      seen[n] = i\\n    return []"
}`,
  hints: '',
  editorial: '',
};

const parseJson = (value) => JSON.parse(value);

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const defaultLanguageMap = { javascript: '', python: '', cpp: '', java: '' };

const parseCodeMap = (value) => {
  try {
    const parsed = parseJson(value);
    return isObject(parsed) ? { ...defaultLanguageMap, ...parsed } : defaultLanguageMap;
  } catch {
    return defaultLanguageMap;
  }
};

const jsonArrayString = (message) =>
  z.string().min(1, 'This field is required.').superRefine((value, ctx) => {
    try {
      const parsed = parseJson(value);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });

const jsonObjectString = (message) =>
  z.string().min(1, 'This field is required.').superRefine((value, ctx) => {
    try {
      const parsed = parseJson(value);
      if (!isObject(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });

const formSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  tags: z
    .string()
    .min(1, 'At least one tag is required.')
    .refine((value) => value.split(',').map((tag) => tag.trim()).filter(Boolean).length > 0, 'At least one valid tag is required.'),
  description: z.string().trim().min(20, 'Description should be at least 20 characters.'),
  inputFormat: z.string().trim().min(10, 'Input format should be at least 10 characters.'),
  outputFormat: z.string().trim().min(10, 'Output format should be at least 10 characters.'),
  constraints: z.string().trim().min(5, 'Constraints are required.'),
  testCaseBlocks: z
    .array(
      z.object({
        input: z.string().trim().min(1, 'Input is required.'),
        output: z.string().trim().min(1, 'Output is required.'),
        explanation: z.string().trim().min(1, 'Explanation is required.'),
      })
    )
    .min(1, 'At least one test case block is required.'),
  codeSnippets: jsonObjectString('Code snippets must be a valid JSON object.'),
  referenceSolution: jsonObjectString('Reference solution must be a valid JSON object.'),
  hints: z.string().optional(),
  editorial: z.string().optional(),
});

const CreateProblemForm = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);

  const tagPreview = useMemo(
    () => formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    [formData.tags]
  );

  const codeSnippetsMap = useMemo(() => parseCodeMap(formData.codeSnippets), [formData.codeSnippets]);
  const referenceSolutionMap = useMemo(() => parseCodeMap(formData.referenceSolution), [formData.referenceSolution]);

  const updateField = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const updateSelectField = (field) => (value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const resetFeedback = () => {
    setError('');
    setSuccess('');
    setFieldErrors({});
  };

  const updateCodeMapField = (field) => (nextMap) => {
    setFormData((prev) => ({
      ...prev,
      [field]: JSON.stringify(nextMap, null, 2),
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const updateTestCaseBlock = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      testCaseBlocks: prev.testCaseBlocks.map((testCase, testCaseIndex) =>
        testCaseIndex === index ? { ...testCase, [field]: value } : testCase
      ),
    }));

    setFieldErrors((prev) => ({
      ...prev,
      testCaseBlocks: undefined,
    }));
  };

  const addTestCaseBlock = () => {
    setFormData((prev) => ({
      ...prev,
      testCaseBlocks: [...prev.testCaseBlocks, createTestCaseBlock()],
    }));

    setFieldErrors((prev) => ({
      ...prev,
      testCaseBlocks: undefined,
    }));
  };

  const removeTestCaseBlock = (index) => {
    setFormData((prev) => {
      if (prev.testCaseBlocks.length === 1) {
        return prev;
      }

      return {
        ...prev,
        testCaseBlocks: prev.testCaseBlocks.filter((_, testCaseIndex) => testCaseIndex !== index),
      };
    });

    setFieldErrors((prev) => ({
      ...prev,
      testCaseBlocks: undefined,
    }));
  };

  const buildPayload = (values) => {
    const parsedReferenceSolution = parseJson(values.referenceSolution);
    const examples = values.testCaseBlocks.map((testCase) => ({
      input: testCase.input.trim(),
      output: testCase.output.trim(),
      explanation: testCase.explanation.trim(),
    }));
    const testCases = values.testCaseBlocks.map((testCase) => ({
      input: testCase.input.trim(),
      expected: testCase.output.trim(),
    }));

    return {
      title: values.title.trim(),
      description: values.description.trim(),
      difficulty: values.difficulty,
      tags: values.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      examples,
      constraints: [
        `Input Format:\n${values.inputFormat.trim()}`,
        `Output Format:\n${values.outputFormat.trim()}`,
        `Constraints:\n${values.constraints.trim()}`,
      ].join('\n\n'),
      testCases,
      codeSnippets: parseJson(values.codeSnippets),
      referenceSolution: parsedReferenceSolution,
      hints: values.hints?.trim() || null,
      editorial: values.editorial?.trim() || null,
    };
  };

  const getFieldError = (field) => fieldErrors[field];
  const hasTestCaseErrors = Boolean(getFieldError('testCaseBlocks'));

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();
    setIsSubmitting(true);

    try {
      const validationResult = formSchema.safeParse(formData);
      console.log('validation Result: ', validationResult);
      if (!validationResult.success) {
        const flattened = validationResult.error.flatten().fieldErrors;
        const nextErrors = Object.fromEntries(
          Object.entries(flattened).map(([key, messages]) => [key, messages?.[0] || 'Invalid value.'])
        );
        setFieldErrors(nextErrors);
        throw new Error('Please fix the highlighted fields before submitting.');
      }

      const payload = buildPayload(validationResult.data);

      const response = await fetch('/api/create-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to create problem.');
      }

      setSuccess('Problem created successfully. You can create another one now.');
      setFormData(initialFormState);
      setFieldErrors({});
      setEditorVersion((prev) => prev + 1);
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong while creating the problem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className='mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-4 md:gap-6 md:py-6'>
      <div className='rounded-3xl border border-neutral-200 bg-white/85 p-5 shadow-sm backdrop-blur-sm md:p-7'>
        <h1 className='text-2xl font-semibold tracking-tight text-neutral-900 md:text-4xl'>Create A New Problem</h1>
        <p className='mt-2 max-w-3xl text-sm text-neutral-600 md:text-base'>
          Build a high-quality challenge by filling problem details, examples, constraints, and language-specific solutions.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]'>
        <form onSubmit={handleSubmit} className='space-y-4 rounded-3xl border border-neutral-200 bg-white/90 p-5 shadow-sm'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Problem Title</Label>
              <Input
                id='title'
                value={formData.title}
                onChange={updateField('title')}
                placeholder='e.g. Longest Palindromic Substring'
                aria-invalid={Boolean(getFieldError('title'))}
              />
              {getFieldError('title') && <p className='text-xs text-red-600'>{getFieldError('title')}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='difficulty'>Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={updateSelectField('difficulty')}>
                <SelectTrigger id='difficulty' className='w-full' aria-invalid={Boolean(getFieldError('difficulty'))}>
                  <SelectValue placeholder='Select difficulty' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='EASY'>Easy</SelectItem>
                  <SelectItem value='MEDIUM'>Medium</SelectItem>
                  <SelectItem value='HARD'>Hard</SelectItem>
                </SelectContent>
              </Select>
              {getFieldError('difficulty') && <p className='text-xs text-red-600'>{getFieldError('difficulty')}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='tags'>Tags (comma-separated)</Label>
            <Input
              id='tags'
              value={formData.tags}
              onChange={updateField('tags')}
              placeholder='Array, Hash Map, Two Pointers'
              aria-invalid={Boolean(getFieldError('tags'))}
            />
            {getFieldError('tags') && <p className='text-xs text-red-600'>{getFieldError('tags')}</p>}
            {tagPreview.length > 0 && (
              <div className='mt-1 flex flex-wrap gap-2'>
                {tagPreview.map((tag) => (
                  <Badge key={tag} variant='secondary'>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={updateField('description')}
              rows={6}
              className='resize-y bg-white'
              placeholder='Write a clear and concise statement of the problem.'
              aria-invalid={Boolean(getFieldError('description'))}
            />
            {getFieldError('description') && <p className='text-xs text-red-600'>{getFieldError('description')}</p>}
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='inputFormat'>Input Format</Label>
              <Textarea
                id='inputFormat'
                value={formData.inputFormat}
                onChange={updateField('inputFormat')}
                rows={5}
                className='resize-y bg-white'
                placeholder='Describe input in a Codeforces style format. Example: The first line contains n. The second line contains n integers.'
                aria-invalid={Boolean(getFieldError('inputFormat'))}
              />
              {getFieldError('inputFormat') && <p className='text-xs text-red-600'>{getFieldError('inputFormat')}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='outputFormat'>Output Format</Label>
              <Textarea
                id='outputFormat'
                value={formData.outputFormat}
                onChange={updateField('outputFormat')}
                rows={5}
                className='resize-y bg-white'
                placeholder='Describe output in a Codeforces style format. Example: Print one integer - the minimum number of operations.'
                aria-invalid={Boolean(getFieldError('outputFormat'))}
              />
              {getFieldError('outputFormat') && <p className='text-xs text-red-600'>{getFieldError('outputFormat')}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='constraints'>Constraints</Label>
            <Textarea
              id='constraints'
              value={formData.constraints}
              onChange={updateField('constraints')}
              rows={4}
              className='resize-y bg-white'
              placeholder='e.g. 1 <= n <= 10^5'
              aria-invalid={Boolean(getFieldError('constraints'))}
            />
            {getFieldError('constraints') && <p className='text-xs text-red-600'>{getFieldError('constraints')}</p>}
          </div>

          <Separator />

          <div className='grid grid-cols-1 gap-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-3'>
                <Label>Test Cases</Label>
                <Button type='button' variant='outline' size='sm' onClick={addTestCaseBlock}>
                  <Plus className='size-4' />
                  Add Testcase
                </Button>
              </div>

              <div className='space-y-3'>
                {formData.testCaseBlocks.map((testCase, index) => (
                  <div key={`test-case-${index}`} className='space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium text-neutral-800'>Case {index + 1}</p>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeTestCaseBlock(index)}
                        disabled={formData.testCaseBlocks.length === 1}
                      >
                        <Trash2 className='size-4' />
                        Remove
                      </Button>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor={`test-case-input-${index}`}>Input</Label>
                      <Textarea
                        id={`test-case-input-${index}`}
                        value={testCase.input}
                        onChange={(event) => updateTestCaseBlock(index, 'input', event.target.value)}
                        rows={4}
                        className='resize-y bg-white font-mono text-xs md:text-sm'
                        placeholder='Write raw input exactly as the judge would provide it.'
                        aria-invalid={hasTestCaseErrors}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor={`test-case-output-${index}`}>Output</Label>
                      <Textarea
                        id={`test-case-output-${index}`}
                        value={testCase.output}
                        onChange={(event) => updateTestCaseBlock(index, 'output', event.target.value)}
                        rows={3}
                        className='resize-y bg-white font-mono text-xs md:text-sm'
                        placeholder='Expected output for this input.'
                        aria-invalid={hasTestCaseErrors}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor={`test-case-explanation-${index}`}>Explanation</Label>
                      <Textarea
                        id={`test-case-explanation-${index}`}
                        value={testCase.explanation}
                        onChange={(event) => updateTestCaseBlock(index, 'explanation', event.target.value)}
                        rows={3}
                        className='resize-y bg-white'
                        placeholder='Explain how this output is derived from the input.'
                        aria-invalid={hasTestCaseErrors}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {getFieldError('testCaseBlocks') && <p className='text-xs text-red-600'>{getFieldError('testCaseBlocks')}</p>}
            </div>

            <div className='space-y-2'>
              <Label>Starter Code Snippets</Label>
              <div className='[&_.h-230]:h-140'>
                <PlatformCodeEditor
                  key={`starter-${editorVersion}`}
                  embedded
                  initialCodeByLanguage={codeSnippetsMap}
                  showExecutionActions={false}
                  showBottomPanels={false}
                  onCodeByLanguageChange={updateCodeMapField('codeSnippets')}
                />
              </div>
              {getFieldError('codeSnippets') && <p className='text-xs text-red-600'>{getFieldError('codeSnippets')}</p>}
            </div>

            <div className='space-y-2'>
              <Label>Reference Solution</Label>
              <div className='[&_.h-230]:h-140'>
                <PlatformCodeEditor
                  key={`reference-${editorVersion}`}
                  embedded
                  initialCodeByLanguage={referenceSolutionMap}
                  showExecutionActions={false}
                  showBottomPanels={false}
                  onCodeByLanguageChange={updateCodeMapField('referenceSolution')}
                />
              </div>
              {getFieldError('referenceSolution') && <p className='text-xs text-red-600'>{getFieldError('referenceSolution')}</p>}
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='hints'>Hints (Optional)</Label>
              <Textarea
                id='hints'
                value={formData.hints}
                onChange={updateField('hints')}
                rows={5}
                className='resize-y bg-white'
                placeholder='Give progressively useful hints.'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='editorial'>Editorial (Optional)</Label>
              <Textarea
                id='editorial'
                value={formData.editorial}
                onChange={updateField('editorial')}
                rows={5}
                className='resize-y bg-white'
                placeholder='Explain brute-force and optimized approaches.'
              />
            </div>
          </div>

          {(error || success) && (
            <Alert variant={error ? 'destructive' : 'default'}>
              <AlertTitle>{error ? 'Validation Error' : 'Success'}</AlertTitle>
              <AlertDescription className={!error ? 'text-emerald-700' : ''}>{error || success}</AlertDescription>
            </Alert>
          )}

          <div className='flex flex-wrap items-center gap-3'>
            <Button type='submit' disabled={isSubmitting} className='min-w-36'>
              {isSubmitting ? 'Creating...' : 'Create Problem'}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setFormData(initialFormState);
                resetFeedback();
                setEditorVersion((prev) => prev + 1);
              }}
            >
              Reset Form
            </Button>
          </div>
        </form>

        <aside className='space-y-4'>
          <div className='rounded-3xl border border-neutral-200 bg-white/90 p-5 shadow-sm'>
            <h2 className='text-lg font-semibold text-neutral-900'>Authoring Checklist</h2>
            <ul className='mt-3 space-y-2 text-sm text-neutral-600'>
              <li>- Keep statement unambiguous with clear input/output format.</li>
              <li>- Include edge-focused test cases (empty, single, max constraints).</li>
              <li>- Ensure starter code signatures match your test harness.</li>
              <li>- Provide at least one optimized reference approach.</li>
            </ul>
          </div>

          <div className='rounded-3xl border border-blue-200 bg-linear-to-br from-blue-50 to-cyan-50 p-5 shadow-sm'>
            <h2 className='text-lg font-semibold text-blue-900'>Formatting Tips</h2>
            <p className='mt-2 text-sm text-blue-800'>
              JSON fields support nested objects and arrays. Use double quotes for keys and strings to avoid parsing errors on submit.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CreateProblemForm;