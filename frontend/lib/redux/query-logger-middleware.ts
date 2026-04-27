// apps/player-web/lib/redux/query-logger-middleware.ts
import { isRejectedWithValue, isFulfilled } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import { toast } from '@workspace/ui/components/use-toast'; // Assuming use-toast is for UI notifications

/**
 * Log a warning and show a toast if a query or mutation fails.
 * This middleware catches `rejected` actions from RTK Query.
 */
export const rtkQueryErrorLogger: Middleware =
  (_api) => (next) => (action) => {
    // RTK Query uses `rejectedWithValue` to indicate a network/server error
    if (isRejectedWithValue(action)) {
      console.warn('Async operation rejected:', action);

      // Extract relevant error information
      const payload = action.payload as unknown;
      const status = (payload as { status?: number | string })?.status;
      const data = (payload as { data?: { message?: string; code?: string } })?.data;
      const error = (payload as { error?: string })?.error;

      const errorMessage = data?.message || error || 'An unexpected error occurred.';
      const errorCode = data?.code || (status ? String(status) : 'UNKNOWN_ERROR');

      // Show a toast notification for critical errors
      // You might want to filter this for specific error codes or statuses
      if (typeof status === 'number' && status >= 400) { // Example: show toast for client-side and server-side errors
        toast({
          title: `API Error ${errorCode || ''}`,
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }

    // You can also log fulfilled actions if needed for debugging
    if (isFulfilled(action)) {
      console.log('Async operation fulfilled:', action);
    }

    return next(action);
  };
