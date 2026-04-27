'use client';

import { useState, useEffect, useCallback } from 'react';
import { OwnerIdentityApi, type OnboardingStatus, type TimelineEvent } from '@/lib/owner-identity/api';

interface UseOnboardingStatusResult {
  status: OnboardingStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch and manage owner onboarding status.
 * Provides real-time status from the backend owner-identity module.
 */
export function useOnboardingStatus(options: { enabled?: boolean } = { enabled: true }): UseOnboardingStatusResult {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(options.enabled ? true : false); // Only start loading if enabled
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!options.enabled) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await OwnerIdentityApi.getStatus();
      setStatus(data);
    } catch (err: any) {
      console.error('Failed to fetch onboarding status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  }, [options.enabled]);

  useEffect(() => {
    if (options.enabled) {
      fetchStatus();
    } else {
        setIsLoading(false);
    }
  }, [fetchStatus, options.enabled]);

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}

/**
 * Hook to fetch owner draft data
 */
export function useOwnerDraft() {
  const [draft, setDraft] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDraft = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await OwnerIdentityApi.getDraft();
      setDraft(data);
    } catch (err: any) {
      // 404 is expected if no draft exists
      if (err.response?.status !== 404) {
        console.error('Failed to fetch owner draft:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch draft');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  return {
    draft,
    isLoading,
    error,
    refetch: fetchDraft,
  };
}

/**
 * Hook to fetch reviewer feedback for changes requested
 */
export function useOwnerFeedback(options: { enabled?: boolean } = { enabled: true }) {
  const [feedback, setFeedback] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(options.enabled ? true : false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!options.enabled) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await OwnerIdentityApi.getFeedback();
      setFeedback(response);
    } catch (err: any) {
      // 404 or specific errors when no feedback exists
      if (err.response?.status !== 404) {
        console.error('Failed to fetch feedback:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch feedback');
      }
    } finally {
      setIsLoading(false);
    }
  }, [options.enabled]);

  useEffect(() => {
    if (options.enabled) {
      fetchFeedback();
    } else {
      setIsLoading(false);
    }
  }, [fetchFeedback, options.enabled]);

  return {
    feedback,
    isLoading,
    error,
    refetch: fetchFeedback,
  };
}

/**
 * Hook to fetch application timeline
 */
export function useApplicationTimeline(options: { enabled?: boolean } = { enabled: true }) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(options.enabled ? true : false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!options.enabled) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await OwnerIdentityApi.getTimeline();
      setTimeline(data);
    } catch (err: any) {
      console.error('Failed to fetch timeline:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch timeline');
    } finally {
      setIsLoading(false);
    }
  }, [options.enabled]);

  useEffect(() => {
    if (options.enabled) {
      fetchTimeline();
    } else {
        setIsLoading(false);
    }
  }, [fetchTimeline, options.enabled]);

  return { timeline, isLoading, error, refetch: fetchTimeline };
}

/**
 * Combined hook for partner dashboard - fetches status and feedback together
 */
export function usePartnerDashboardData() {
  const { status, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useOnboardingStatus();
  
  const { feedback, isLoading: feedbackLoading, error: feedbackError, refetch: refetchFeedback } = useOwnerFeedback({
    enabled: status?.ownerState === 'CHANGES_REQUESTED'
  });

  const { timeline, isLoading: timelineLoading, error: timelineError, refetch: refetchTimeline } = useApplicationTimeline({
      enabled: !!status
  });

  const refetchAll = useCallback(() => {
     refetchStatus();
     refetchFeedback();
     refetchTimeline();
  }, [refetchStatus, refetchFeedback, refetchTimeline]);

  return {
    status,
    feedback,
    timeline,
    isLoading: statusLoading || feedbackLoading || (status ? timelineLoading : false),
    error: statusError || feedbackError || timelineError,
    refetch: refetchAll,
  };
}
