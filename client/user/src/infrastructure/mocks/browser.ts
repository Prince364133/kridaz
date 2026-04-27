import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { config } from '@/lib/config';

export const worker = setupWorker(...handlers);

// Export an init function to conditionally start it safely in layout.tsx or main entry points
export async function enableMocking() {
  if (!config.mocking.enabled) {
    return;
  }
  return worker.start({ onUnhandledRequest: 'bypass' });
}
