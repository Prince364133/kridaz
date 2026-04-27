import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

export interface NormalizedError {
  message: string;
  code: string;
  errors: unknown[];
  status?: number | string;
}

export function normalizeError(originalError: any): NormalizedError {
  let message = 'An unknown API error occurred.';
  let code = 'UNKNOWN_ERROR';
  let errors: unknown[] = [];
  let status: number | string | undefined = undefined;

  if (originalError) {
    status = originalError.status;
    
    // RTK Query wraps the response in `.data`
    if (originalError.data) {
      const data = originalError.data as any;
      message = data.message || originalError.error || message;
      code = data.code || status?.toString() || code;
      errors = data.errors || errors;
    } else if (originalError.error) {
      message = originalError.error;
    } else if (originalError.message) {
      message = originalError.message;
    }
  }

  return { message, code, errors, status };
}
