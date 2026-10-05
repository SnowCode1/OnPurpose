type Clock = {
  setTimeout: (callback: () => void, delay: number) => unknown;
  clearTimeout: (timer: unknown) => void;
};
// Editing stays synchronous inside ProseMirror; only reporting to native is
// batched. A deadline still reports during uninterrupted typing.
export function descriptionUpdateQueue(
  report: () => void,
  clock: Clock = {
    setTimeout: (callback, delay) => setTimeout(callback, delay),
    clearTimeout: (timer) =>
      clearTimeout(timer as ReturnType<typeof setTimeout>),
  },
) {
  let quiet: unknown,
    deadline: unknown,
    pending = false,
    disposed = false;
  function cancel() {
    if (quiet !== undefined) clock.clearTimeout(quiet);
    if (deadline !== undefined) clock.clearTimeout(deadline);
    quiet = deadline = undefined;
    pending = false;
  }
  function flush() {
    const needed = pending;
    cancel();
    if (needed) report();
    return needed;
  }
  return {
    queue() {
      if (disposed) return;
      pending = true;
      if (quiet !== undefined) clock.clearTimeout(quiet);
      quiet = clock.setTimeout(flush, 200);
      if (deadline === undefined) deadline = clock.setTimeout(flush, 1000);
    },
    flush,
    cancel,
    dispose() {
      disposed = true;
      flush();
    },
  };
}
