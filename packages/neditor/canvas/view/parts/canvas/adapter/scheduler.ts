import { setOnEnd } from '../../../../canvasCommon/scheduler';

let queued = false;
const queue: Function[] = [];

export const queueJob = (job: Function) => {
  if (!queue.includes(job)) queue.push(job);
  if (!queued) {
    queued = true;
  }
};

const flushJobs = () => {
  for (const job of queue) {
    job();
  }
  queue.length = 0;
  queued = false;
};

setOnEnd(flushJobs);
