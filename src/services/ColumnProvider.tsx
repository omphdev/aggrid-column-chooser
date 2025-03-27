import React, { createContext, useContext, ReactNode } from 'react';
import dashboardStateService, { DashboardState } from './dashboardStateService';
import useDashboardState from '../hooks/useDashboardState';

// Create context with default values
const ColumnContext = createContext<{
  state: DashboardState;
  service: typeof dashboardStateService;
}>({
  state: dashboardStateService.value,
  service: dashboardStateService
});

// Provider component props
interface ColumnProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes column state available throughout the app
 */
export const ColumnProvider: React.FC<ColumnProviderProps> = ({ children }) => {
  // Use our custom hook to subscribe to state changes
  const [state, service] = useDashboardState();
  
  return (
    <ColumnContext.Provider value={{ state, service }}>
      {children}
    </ColumnContext.Provider>
  );
};

/**
 * Custom hook to use column context
 */
export const useColumnContext = () => {
  const context = useContext(ColumnContext);
  if (!context) {
    throw new Error('useColumnContext must be used within a ColumnProvider');
  }
  return context;
};