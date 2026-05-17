import { Queue, Worker } from 'bullmq';
import { bullmqConnection as connection } from '../config/redis.js';


import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const mediaQueue = new Queue('media_processing', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  }
});

// ── Sandboxed Worker ─────────────────────────────────────────────────────────
const processorPath = path.join(__dirname, 'processors', 'media.processor.js');

export const mediaWorker = new Worker('media_processing', processorPath, {
  connection,
  concurrency: 2,
  useWorkerThreads: false,
});
