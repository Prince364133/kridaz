'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { featureFlags, type FeatureFlag } from './featureFlags';

type FeatureFlagsContextType = {
  flags: Record<FeatureFlag, boolean>;
  setFlag: (flag: FeatureFlag, value: boolean) => void;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>(featureFlags);

  const setFlag = (flag: FeatureFlag, value: boolean) => {
    setFlags((prev) => ({ ...prev, [flag]: value }));
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, setFlag }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
