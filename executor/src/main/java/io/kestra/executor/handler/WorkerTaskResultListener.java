package io.kestra.executor.handler;

import io.kestra.core.runners.WorkerTaskResult;

/**
 * Extension point notified after the executor has processed a {@link WorkerTaskResult} for its execution —
 * either joining the result or failing the execution from the executor-side fallback paths.
 * <p>
 * A plain redelivery of an already-joined taskrun is not notified; killswitched results are not notified
 * either. Listeners run synchronously on whichever executor thread handled the message, so they may be
 * called concurrently and must be thread-safe — keep them cheap and non-blocking. A listener throwing
 * does not fail execution processing and does not stop the remaining listeners.
 */
public interface WorkerTaskResultListener {
    void onJoined(WorkerTaskResult workerTaskResult);
}
