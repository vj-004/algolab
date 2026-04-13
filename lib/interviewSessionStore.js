const getGlobalStore = () => {
  if (!globalThis.__algolabInterviewSessions) {
    globalThis.__algolabInterviewSessions = new Map();
  }

  return globalThis.__algolabInterviewSessions;
};

export const createInterviewSession = ({ code, problemIds }) => {
  const store = getGlobalStore();
  const session = {
    code,
    problemIds,
    createdAt: new Date().toISOString(),
  };

  store.set(code, session);
  return session;
};

export const getInterviewSession = (code) => {
  const store = getGlobalStore();
  return store.get(code) || null;
};

export const hasInterviewSession = (code) => {
  const store = getGlobalStore();
  return store.has(code);
};
