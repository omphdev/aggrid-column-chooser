import { useState, useEffect } from 'react';
import dashboardStateService, { DashboardState } from '../services/dashboardStateService';

/**
 * Custom hook to subscribe to dashboard state changes
 * @returns An array with [current state, state service]
 */
export const useDashboardState = () => {
  const [state, setState] = useState<DashboardState>(dashboardStateService.value);
  
  useEffect(() => {
    // Subscribe to state changes
    const subscription = dashboardStateService.subscribe(newState => {
      setState(newState);
    });
    
    // Unsubscribe on cleanup
    return () => subscription.unsubscribe();
  }, []);
  
  return [state, dashboardStateService] as const;
};

export default useDashboardState;