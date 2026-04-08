'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const defaultSnippets = {
  javascript: `function solve(input) {
  // input can be parsed from JSON or plain text
  // return the final answer
  return null;
}`,
  python: `def solve(input_data):
  # input_data can be parsed from JSON or plain text
  # return the final answer
  return None`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
  //write your code below

  return 0;
};`,
  java: `import java.util.*;

class Solution {
    public static String solve(String input) {
        // parse input and return output
        return "";
    }
}`,
};

const languageOptions = [
  { label: 'JavaScript', value: 'javascript', monaco: 'javascript' },
  { label: 'Python', value: 'python', monaco: 'python' },
  { label: 'C++', value: 'cpp', monaco: 'cpp' },
  { label: 'Java', value: 'java', monaco: 'java' },
];

const PlatformCodeEditor = ({
  initialLanguage = 'cpp',
  initialCodeByLanguage = defaultSnippets,
  defaultInput = '{"nums": [2, 7, 11, 15], "target": 9}',
  embedded = false,
  showBottomPanels = false,
  showExecutionActions = true,
  onCodeByLanguageChange,
  onRun,
  onSubmit,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [activeBottomTab, setActiveBottomTab] = useState('input');
  const [isExpanded, setIsExpanded] = useState(false);
  const [codeByLanguage, setCodeByLanguage] = useState(() => ({
    ...defaultSnippets,
    ...initialCodeByLanguage,
  }));
  const [customInput, setCustomInput] = useState(defaultInput);
  const [output, setOutput] = useState('// Output will appear here after you run the code.');
  const [isRunning, setIsRunning] = useState(false);
  const hasMountedRef = useRef(false);
  const onCodeByLanguageChangeRef = useRef(onCodeByLanguageChange);

  const monacoLanguage = useMemo(
    () => languageOptions.find((option) => option.value === selectedLanguage)?.monaco || 'javascript',
    [selectedLanguage]
  );

  const activeCode = codeByLanguage[selectedLanguage] || '';

  const setActiveCode = (newCode) => {
    setCodeByLanguage((prev) => ({
      ...prev,
      [selectedLanguage]: newCode || '',
    }));
  };

  const resetCurrentLanguage = () => {
    setCodeByLanguage((prev) => ({
      ...prev,
      [selectedLanguage]: defaultSnippets[selectedLanguage] || '',
    }));
  };

  useEffect(() => {
    onCodeByLanguageChangeRef.current = onCodeByLanguageChange;
  }, [onCodeByLanguageChange]);

  useEffect(() => {
    if (!onCodeByLanguageChangeRef.current) {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    onCodeByLanguageChangeRef.current(codeByLanguage);
  }, [codeByLanguage]);

  const runCode = async () => {
    setIsRunning(true);
    try {
      if (onRun) {
        const result = await onRun({
          language: selectedLanguage,
          code: activeCode,
          input: customInput,
        });

        if (typeof result === 'string') {
          setOutput(result);
        } else {
          setOutput(JSON.stringify(result, null, 2));
        }
      } else {
        setOutput(
          [
            'Mock run complete.',
            `Language: ${selectedLanguage}`,
            '',
            'Input:',
            customInput,
            '',
            'Code length:',
            `${activeCode.length} characters`,
          ].join('\n')
        );
      }
    } catch (error) {
      setOutput(`Runtime error:\n${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!onSubmit) {
      setOutput('Submission hook not connected yet.');
      return;
    }

    try {
      const result = await onSubmit({
        language: selectedLanguage,
        code: activeCode,
      });
      setOutput(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput(`Submission error:\n${error.message}`);
    }
  };

  return (
    <section
      className={`mx-auto flex w-full flex-1 flex-col gap-4 p-4 transition-all duration-300 md:gap-6 md:p-6 ${
        embedded ? 'max-w-none p-0 md:p-0' : isExpanded ? 'max-w-7xl' : 'max-w-5xl'
      }`}
    >
      <Card className='min-h-140 rounded-3xl border border-neutral-200 bg-white/95 ring-0'>
        <CardHeader className='border-b border-neutral-200/80 py-4'>
          <div className='flex w-full flex-wrap items-end gap-3'>
            <div className='min-w-44 flex-1 space-y-2'>
                <Label className='text-xs font-semibold uppercase tracking-wide text-neutral-500'>Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className='w-full rounded-xl'>
                    <SelectValue placeholder='Select language' />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            <div className='min-w-40 flex-1'>
              <div className='flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2'>
                  <Label className='text-xs font-semibold uppercase tracking-wide text-neutral-500 whitespace-nowrap'>Theme</Label>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='rounded-lg'
                    onClick={() => setTheme((prev) => (prev === 'vs-dark' ? 'light' : 'vs-dark'))}
                  >
                    {theme === 'vs-dark' ? 'Dark' : 'Light'}
                  </Button>
              </div>
            </div>

            <div className='min-w-56 flex-1'>
              <div className='flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2'>
                  <Label className='text-xs font-semibold uppercase tracking-wide text-neutral-500 whitespace-nowrap'>Font Size</Label>
                  <div className='flex items-center gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='rounded-lg'
                      onClick={() => setFontSize((prev) => Math.max(12, prev - 1))}
                    >
                      A-
                    </Button>
                    <span className='w-8 text-center text-sm font-medium text-neutral-700'>{fontSize}</span>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='rounded-lg'
                      onClick={() => setFontSize((prev) => Math.min(22, prev + 1))}
                    >
                      A+
                    </Button>
                  </div>
              </div>
            </div>

            {!embedded && (
              <div className='min-w-44 flex-1'>
                <div className='flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2'>
                    <Label className='text-xs font-semibold uppercase tracking-wide text-neutral-500 whitespace-nowrap'>Layout</Label>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='rounded-lg'
                      onClick={() => setIsExpanded((prev) => !prev)}
                    >
                      {isExpanded ? 'Compact' : 'Expand'}
                    </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className='h-230 p-0'>
          <Editor
            height='100%'
            language={monacoLanguage}
            theme={theme}
            value={activeCode}
            onChange={setActiveCode}
            options={{
              fontSize,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontLigatures: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbersMinChars: 3,
              tabSize: 2,
              wordWrap: 'on',
            }}
          />
        </CardContent>

        {showExecutionActions && (
          <div className='flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200/80 px-6 py-4'>
            <Button type='button' variant='outline' onClick={resetCurrentLanguage}>
              Reset Current Language
            </Button>
            <div className='flex items-center gap-2'>
              <Button type='button' variant='outline' onClick={runCode} disabled={isRunning}>
                {isRunning ? 'Running...' : 'Run Code'}
              </Button>
              <Button type='button' onClick={submitCode}>
                Submit
              </Button>
            </div>
          </div>
        )}

        {showBottomPanels && (
          <div className='border-t border-neutral-200/80 px-6 py-4'>
            <div className='mb-3 flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-1'>
              <Button
                type='button'
                variant={activeBottomTab === 'input' ? 'default' : 'ghost'}
                className='h-9 flex-1 rounded-lg'
                onClick={() => setActiveBottomTab('input')}
              >
                Custom Input
              </Button>
              <Button
                type='button'
                variant={activeBottomTab === 'output' ? 'default' : 'ghost'}
                className='h-9 flex-1 rounded-lg'
                onClick={() => setActiveBottomTab('output')}
              >
                Output Console
              </Button>
            </div>

            {activeBottomTab === 'input' ? (
              <div className='rounded-2xl border border-neutral-200 bg-white p-3'>
                <p className='mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500'>Paste sample test input</p>
                <Textarea
                  value={customInput}
                  onChange={(event) => setCustomInput(event.target.value)}
                  rows={10}
                  className='min-h-60 resize-none border-neutral-200 bg-neutral-50 font-mono text-xs md:text-sm'
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className='rounded-2xl border border-neutral-200 bg-white p-3'>
                <p className='mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500'>Execution output</p>
                <pre className='min-h-55 overflow-auto rounded-2xl bg-neutral-950 p-3 font-mono text-xs text-green-300 md:text-sm'>
                  {output}
                </pre>
              </div>
            )}
          </div>
        )}

      </Card>
    </section>
  );
};

export default PlatformCodeEditor;