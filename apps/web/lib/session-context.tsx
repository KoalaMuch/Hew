'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { createSession, getSession, setSessionToken } from '@/lib/api';

interface Session {
  id: string;
  displayName?: string;
  avatarSeed?: string;
  avatarUrl?: string | null;
}

interface SessionContextValue {
  session: Session | null;
  sessionId: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      let data = await getSession();
      if (!data) {
        const created = await createSession();
        data = { id: created.id };
      }
      setSession(data);
      setSessionToken(data.id);
    } catch {
      try {
        const created = await createSession();
        setSession({ id: created.id });
        setSessionToken(created.id);
      } catch {
        setSession(null);
        setSessionToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider
      value={{
        session,
        sessionId: session?.id ?? null,
        isLoading,
        refresh,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}
