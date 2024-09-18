/**
 * Blocks the current thread for the specified number of milliseconds.
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
