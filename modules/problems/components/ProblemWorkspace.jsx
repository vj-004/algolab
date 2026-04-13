'use client';

import { useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PlatformCodeEditor from '@/modules/problems/components/PlatformCodeEditor';
import SharedCodeEditor from '@/modules/problems/components/sharedCodeEditor';
import { ReactSketchCanvas } from 'react-sketch-canvas';

const tabs = ['Description', 'Canvas', 'Editorial', 'Reference Solution'];

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const toPrettyText = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const parseConstraintSections = (rawConstraints) => {
  const constraintsText = (rawConstraints || '').trim();

  if (!constraintsText.includes('Input Format:') && !constraintsText.includes('Output Format:')) {
    return {
      inputFormat: '',
      outputFormat: '',
      constraints: constraintsText,
    };
  }

  const inputMatch = constraintsText.match(/Input Format:\n([\s\S]*?)(?:\n\nOutput Format:|\n\nConstraints:|$)/);
  const outputMatch = constraintsText.match(/Output Format:\n([\s\S]*?)(?:\n\nConstraints:|$)/);
  const constraintsMatch = constraintsText.match(/Constraints:\n([\s\S]*)$/);

  return {
    inputFormat: inputMatch?.[1]?.trim() || '',
    outputFormat: outputMatch?.[1]?.trim() || '',
    constraints: constraintsMatch?.[1]?.trim() || constraintsText,
  };
};

const ProblemWorkspace = ({
  problem,
  hideMeta = false,
  useSharedEditor = false,
  sharedRoomId,
  isInterviewSession = false,
  allowSharedInitialSeed = false,
}) => {
  const [activeTab, setActiveTab] = useState('Description');
  const canvasRef = useRef(null);

  const availableTabs = useMemo(
    () => (isInterviewSession ? ['Description', 'Canvas'] : tabs),
    [isInterviewSession]
  );
  const resolvedActiveTab = availableTabs.includes(activeTab) ? activeTab : 'Description';

  const examples = Array.isArray(problem?.examples) ? problem.examples : [];
  const testCases = Array.isArray(problem?.testCases) ? problem.testCases : [];
  const codeSnippets = isPlainObject(problem?.codeSnippets) ? problem.codeSnippets : {};
  const referenceSolution = isPlainObject(problem?.referenceSolution) ? problem.referenceSolution : {};
  const parsedConstraints = parseConstraintSections(problem?.constraints);

  const handleCanvasUndo = async () => {
    await canvasRef.current?.undo();
  };

  const handleCanvasRedo = async () => {
    await canvasRef.current?.redo();
  };

  const handleCanvasClear = async () => {
    await canvasRef.current?.clearCanvas();
  };

  return (
    <div className='flex h-full min-h-0 flex-col gap-4 overflow-hidden px-1 pb-1 lg:flex-row lg:gap-6'>
      <Card className='h-full min-h-0 w-full gap-0 border border-neutral-300 py-0 shadow-md lg:w-1/2'>
        <div className='flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-3'>
          {availableTabs.map((tab) => (
            <button
              key={tab}
              type='button'
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl px-3 py-1.5 text-sm font-medium transition-colors ${
                resolvedActiveTab === tab
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div
          className={`min-h-0 flex-1 p-4 ${
            resolvedActiveTab === 'Canvas' ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {resolvedActiveTab === 'Description' && (
            <div className='space-y-5'>
              <div className='space-y-2'>
                <h1 className='text-2xl font-semibold text-neutral-900'>{problem?.title}</h1>
                {!hideMeta && (
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='outline'>{problem?.difficulty || 'Unknown'}</Badge>
                    {(problem?.tags || []).map((tag) => (
                      <Badge key={tag} variant='secondary'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <section className='space-y-2'>
                <h2 className='text-base font-semibold text-neutral-900'>Problem Description</h2>
                <p className='whitespace-pre-wrap text-sm text-neutral-700'>{problem?.description || 'No description available.'}</p>
              </section>

              {parsedConstraints.inputFormat && (
                <section className='space-y-2'>
                  <h2 className='text-base font-semibold text-neutral-900'>Input Format</h2>
                  <p className='whitespace-pre-wrap text-sm text-neutral-700'>{parsedConstraints.inputFormat}</p>
                </section>
              )}

              {parsedConstraints.outputFormat && (
                <section className='space-y-2'>
                  <h2 className='text-base font-semibold text-neutral-900'>Output Format</h2>
                  <p className='whitespace-pre-wrap text-sm text-neutral-700'>{parsedConstraints.outputFormat}</p>
                </section>
              )}

              <section className='space-y-2'>
                <h2 className='text-base font-semibold text-neutral-900'>Constraints</h2>
                <p className='whitespace-pre-wrap text-sm text-neutral-700'>{parsedConstraints.constraints || 'No constraints provided.'}</p>
              </section>

              <section className='space-y-3'>
                <h2 className='text-base font-semibold text-neutral-900'>Examples</h2>
                {examples.length === 0 && <p className='text-sm text-neutral-600'>No examples provided.</p>}
                {examples.map((example, index) => (
                  <div key={`example-${index}`} className='rounded-2xl border border-neutral-200 bg-neutral-50 p-3'>
                    <p className='mb-2 text-sm font-semibold text-neutral-800'>Example {index + 1}</p>
                    <p className='text-xs font-semibold uppercase tracking-wide text-neutral-500'>Input</p>
                    <pre className='mt-1 whitespace-pre-wrap rounded-xl bg-white p-2 font-mono text-xs text-neutral-800'>{toPrettyText(example?.input)}</pre>
                    <p className='mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500'>Output</p>
                    <pre className='mt-1 whitespace-pre-wrap rounded-xl bg-white p-2 font-mono text-xs text-neutral-800'>{toPrettyText(example?.output)}</pre>
                    {example?.explanation && (
                      <>
                        <p className='mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500'>Explanation</p>
                        <p className='mt-1 whitespace-pre-wrap text-sm text-neutral-700'>{example.explanation}</p>
                      </>
                    )}
                  </div>
                ))}
              </section>
            </div>
          )}

          {resolvedActiveTab === 'Canvas' && (
            <div className='flex h-full min-h-0 flex-col gap-4'>
              <div className='shrink-0'>
                <h2 className='text-base font-semibold text-neutral-900'>Candidate Whiteboard</h2>
                <p className='text-sm text-neutral-600'>Use this space to sketch ideas while solving.</p>
              </div>

              <div className='shrink-0 flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={handleCanvasUndo}
                  className='rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50'
                >
                  Undo
                </button>
                <button
                  type='button'
                  onClick={handleCanvasRedo}
                  className='rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50'
                >
                  Redo
                </button>
                <button
                  type='button'
                  onClick={handleCanvasClear}
                  className='rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50'
                >
                  Clear
                </button>
              </div>

              <div className='min-h-0 flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white'>
                <ReactSketchCanvas
                  ref={canvasRef}
                  strokeWidth={4}
                  strokeColor='#171717'
                  canvasColor='#ffffff'
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          )}

          {resolvedActiveTab === 'Editorial' && (
            <div className='space-y-5'>
              <section className='space-y-2'>
                <h2 className='text-base font-semibold text-neutral-900'>Editorial</h2>
                <p className='whitespace-pre-wrap text-sm text-neutral-700'>
                  {problem?.editorial || 'No editorial has been added for this problem yet.'}
                </p>
              </section>

              <Separator />

              <section className='space-y-2'>
                <h2 className='text-base font-semibold text-neutral-900'>Hints</h2>
                <p className='whitespace-pre-wrap text-sm text-neutral-700'>
                  {problem?.hints || 'No hints available yet.'}
                </p>
              </section>
            </div>
          )}

          {resolvedActiveTab === 'Reference Solution' && (
            <div className='space-y-4'>
              <h2 className='text-base font-semibold text-neutral-900'>Reference Solutions</h2>
              {Object.keys(referenceSolution).length === 0 && (
                <p className='text-sm text-neutral-600'>No reference solution provided.</p>
              )}

              {Object.entries(referenceSolution).map(([language, solution]) => (
                <div key={language} className='rounded-2xl border border-neutral-200 bg-neutral-50 p-3'>
                  <p className='mb-2 text-sm font-semibold text-neutral-800'>{language}</p>
                  <pre className='max-h-72 overflow-auto whitespace-pre rounded-xl bg-neutral-950 p-3 font-mono text-xs text-neutral-100'>
                    {toPrettyText(solution)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className='flex h-full min-h-0 w-full flex-col gap-4 lg:w-1/2'>
        <Card className='min-h-0 flex-7 gap-0 border border-neutral-300 py-0 shadow-md'>
          <div className='shrink-0 border-b border-neutral-200 px-4 py-3'>
            <h2 className='text-sm font-semibold text-neutral-900'>Code Editor</h2>
          </div>
          <div className='min-h-0 flex-1 overflow-hidden'>
            {useSharedEditor ? (
              <SharedCodeEditor
                roomId={`${sharedRoomId || 'interview-room'}-${problem?.id || 'problem'}`}
                initialCodeByLanguage={codeSnippets}
                allowInitialSeed={allowSharedInitialSeed}
              />
            ) : (
              <PlatformCodeEditor
                embedded
                initialCodeByLanguage={codeSnippets}
                showBottomPanels={false}
                showExecutionActions={false}
              />
            )}
          </div>
        </Card>
        
        <Card className='min-h-0 flex-3 gap-0 border border-neutral-300 py-0 shadow-md'>
          <div className='shrink-0 border-b border-neutral-200 px-4 py-3'>
            <h2 className='text-sm font-semibold text-neutral-900'>Test Cases and Output</h2>
            <p className='text-xs text-neutral-500'>Scroll inside this panel to view all case explanations.</p>
          </div>

          <div className='min-h-0 flex-1 overflow-y-auto p-3'>
            <div className='space-y-3'>
              {testCases.length === 0 && <p className='text-sm text-neutral-600'>No test cases available.</p>}

              {testCases.map((testCase, index) => {
                const linkedExample = examples[index] || {};

                return (
                  <div key={`test-case-${index}`} className='rounded-2xl border border-neutral-200 bg-neutral-50 p-3'>
                    <p className='mb-2 text-sm font-semibold text-neutral-800'>Case {index + 1}</p>

                    <p className='text-xs font-semibold uppercase tracking-wide text-neutral-500'>Input</p>
                    <pre className='mt-1 whitespace-pre-wrap rounded-xl bg-white p-2 font-mono text-xs text-neutral-800'>
                      {toPrettyText(testCase?.input)}
                    </pre>

                    <p className='mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500'>Output</p>
                    <pre className='mt-1 whitespace-pre-wrap rounded-xl bg-white p-2 font-mono text-xs text-neutral-800'>
                      {toPrettyText(testCase?.expected ?? testCase?.output)}
                    </pre>

                    {(linkedExample?.explanation || testCase?.explanation) && (
                      <>
                        <p className='mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500'>Explanation</p>
                        <p className='mt-1 whitespace-pre-wrap text-sm text-neutral-700'>
                          {linkedExample?.explanation || testCase?.explanation}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        
      </div>
    </div>
  );
};

export default ProblemWorkspace;
