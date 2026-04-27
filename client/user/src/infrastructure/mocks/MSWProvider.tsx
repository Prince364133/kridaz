'use client';

import { ReactNode, useEffect, useState } from 'react';
import { config } from '@/lib/config';

export function MSWProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Conditionally enable MSW only if the environment allows it
      if (config.mocking.enabled) {
        const { enableMocking } = await import('./browser');
        await enableMocking();
      }
      setIsReady(true);
    };

    init();
  }, []);

  if (!mswReady) {
    // Optionally return null or a generic loader while MSW spins up to intercept early requests
    return null;
  }

  return <>{children}</>;
}
