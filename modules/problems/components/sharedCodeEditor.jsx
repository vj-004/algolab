'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { toast } from 'sonner';

const languageOptions = [
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { value: 'python', label: 'Python', monaco: 'python' },
  { value: 'cpp', label: 'C++', monaco: 'cpp' },
  { value: 'java', label: 'Java', monaco: 'java' },
];

const SharedCodeEditor = ({
  roomId,
  websocketUrl = process.env.NEXT_PUBLIC_YJS_WS_URL || 'ws://localhost:1234',
  language = 'cpp',
  theme = 'vs-dark',
  initialValue = '',
  initialCodeByLanguage = {},
  allowInitialSeed = false,
  readOnly = false,
  className = '',
  onEditorChange,
}) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const providerRef = useRef(null);
  const yDocRef = useRef(null);
  const bindingRef = useRef(null);
  const seededLanguagesRef = useRef(new Set());
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const previousStatusRef = useRef('connecting');

  const activeRoomId = useMemo(() => {
    if (typeof roomId === 'string' && roomId.trim().length > 0) {
      return roomId.trim();
    }

    return `algolab-room-${new Date().toISOString().slice(0, 10)}`;
  }, [roomId]);

  const activeMonacoLanguage = useMemo(
    () => languageOptions.find((option) => option.value === selectedLanguage)?.monaco || 'javascript',
    [selectedLanguage]
  );

  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !monacoRef.current) {
      return;
    }

    const yDoc = new Y.Doc();
    const provider = new WebsocketProvider(websocketUrl, activeRoomId, yDoc, { connect: true });

    yDocRef.current = yDoc;
    providerRef.current = provider;

    const handleStatus = ({ status }) => {
      setConnectionStatus(status);

      if (status === previousStatusRef.current) {
        return;
      }

      if (status === 'connected') {
        toast.success('You are connected now.');
      }

      if (status === 'disconnected') {
        toast.error('You are not connected right now.');
      }

      previousStatusRef.current = status;
    };

    provider.on('status', handleStatus);

    return () => {
      provider.off('status', handleStatus);

      if (bindingRef.current) {
        bindingRef.current.destroy();
      }

      provider.destroy();
      yDoc.destroy();

      bindingRef.current = null;
      providerRef.current = null;
      yDocRef.current = null;
    };
  }, [activeRoomId, isEditorReady, websocketUrl]);

  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !monacoRef.current || !yDocRef.current || !providerRef.current) {
      return;
    }

    const editor = editorRef.current;
    let model = editor.getModel();

    if (!model) {
      model = monacoRef.current.editor.createModel('', activeMonacoLanguage);
      editor.setModel(model);
    } else {
      monacoRef.current.editor.setModelLanguage(model, activeMonacoLanguage);
    }

    const yDoc = yDocRef.current;
    const provider = providerRef.current;
    const yText = yDoc.getText(`monaco-${selectedLanguage}`);

    if (bindingRef.current) {
      bindingRef.current.destroy();
    }

    const binding = new MonacoBinding(yText, model, new Set([editor]), providerRef.current.awareness);
    bindingRef.current = binding;

    const seedLanguageIfNeeded = (isSynced) => {
      if (!isSynced || !allowInitialSeed || seededLanguagesRef.current.has(selectedLanguage)) {
        return;
      }

      const seededValue = initialCodeByLanguage?.[selectedLanguage] || initialValue;
      if (yText.length === 0 && typeof seededValue === 'string' && seededValue.length > 0) {
        yText.insert(0, seededValue);
      }

      seededLanguagesRef.current.add(selectedLanguage);
    };

    const handleSync = (isSynced) => {
      seedLanguageIfNeeded(Boolean(isSynced));
    };

    provider.on('sync', handleSync);
    if (provider.synced) {
      seedLanguageIfNeeded(true);
    }

    return () => {
      provider.off('sync', handleSync);
      if (bindingRef.current === binding) {
        binding.destroy();
        bindingRef.current = null;
      }
    };
  }, [activeMonacoLanguage, allowInitialSeed, initialCodeByLanguage, initialValue, isEditorReady, selectedLanguage]);

  const toggleConnection = () => {
    const provider = providerRef.current;
    if (!provider) {
      toast.error('You are not connected right now.');
      return;
    }

    if (connectionStatus === 'connected') {
      return;
    }

    provider.connect();
    setConnectionStatus('connecting');
  };

  return (
    <section className={`flex h-full min-h-0 w-full flex-col gap-2 ${className} p-1`}>
      <div className='flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-1 py-1 text-xs text-neutral-600'>
        <div className='flex flex-wrap items-center gap-2'>
          <select
            value={selectedLanguage}
            onChange={(event) => setSelectedLanguage(event.target.value)}
            className='h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs font-medium text-neutral-700 outline-none focus:border-sky-400'
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type='button'
          onClick={toggleConnection}
          disabled={connectionStatus === 'connected'}
          className='rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500'
        >
          {connectionStatus === 'connected' ? 'Connected' : 'Connect'}
        </button>
      </div>

      <div className='h-full min-h-0 overflow-hidden rounded-xl border border-neutral-200'>
        <Editor
          height='100%'
          defaultLanguage={activeMonacoLanguage}
          language={activeMonacoLanguage}
          defaultValue=''
          theme={theme}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            setIsEditorReady(true);
          }}
          onChange={(value) => {
            if (onEditorChange) {
              onEditorChange(value || '', selectedLanguage);
            }
          }}
          options={{
            readOnly,
            minimap: { enabled: false },
            automaticLayout: true,
            fontSize: 14,
            tabSize: 2,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          }}
        />
      </div>
    </section>
  );
};

export default SharedCodeEditor;
