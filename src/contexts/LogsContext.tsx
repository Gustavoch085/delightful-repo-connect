
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'edit' | 'delete';
  entity: 'cliente' | 'produto' | 'orcamento';
  entityName: string;
  timestamp: Date;
  details?: string;
}

interface LogsContextType {
  logs: LogEntry[];
  addLog: (action: 'create' | 'edit' | 'delete', entity: 'cliente' | 'produto' | 'orcamento', entityName: string, details?: string) => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export const useLogs = () => {
  const context = useContext(LogsContext);
  if (context === undefined) {
    throw new Error('useLogs must be used within a LogsProvider');
  }
  return context;
};

interface LogsProviderProps {
  children: ReactNode;
}

export const LogsProvider = ({ children }: LogsProviderProps) => {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const savedLogs = localStorage.getItem('crm_logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  const { user } = useAuth();

  const addLog = (action: 'create' | 'edit' | 'delete', entity: 'cliente' | 'produto' | 'orcamento', entityName: string, details?: string) => {
    if (!user) return;

    const newLog: LogEntry = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      action,
      entity,
      entityName,
      timestamp: new Date(),
      details
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('crm_logs', JSON.stringify(updatedLogs));
  };

  return (
    <LogsContext.Provider value={{ logs, addLog }}>
      {children}
    </LogsContext.Provider>
  );
};
