import React from 'react';
import { Toast } from '../hooks/useToast';

export interface AppContextType {
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => string;
  removeToast: (id: string) => void;
}

export const AppContext = React.createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
