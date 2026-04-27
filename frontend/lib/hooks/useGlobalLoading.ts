// apps/player-web/lib/hooks/useGlobalLoading.ts
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store'; // Assuming RootState is defined here

export const useGlobalLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const apiState = useSelector((state: RootState) => state.api); // Access the RTK Query API state

  useEffect(() => {
    let activeQueries = 0;
    let activeMutations = 0;

    // Count active queries
    for (const key in apiState.queries) {
      if (apiState.queries[key]?.status === 'pending') {
        activeQueries++;
      }
    }

    // Count active mutations
    for (const key in apiState.mutations) {
      if (apiState.mutations[key]?.status === 'pending') {
        activeMutations++;
      }
    }

    setIsLoading(activeQueries > 0 || activeMutations > 0);
  }, [apiState]);

  return isLoading;
};