type RetryOptions = {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  onError?: (error: any, attempt: number) => void;
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T | null> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 5000,
    onError
  } = options;

  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (onError) {
        onError(error, attempt);
      }

      if (attempt === maxAttempts) {
        console.error(`All ${maxAttempts} attempts failed:`, error);
        return null;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      const cappedDelay = Math.min(delay, maxDelay);
      await new Promise(resolve => setTimeout(resolve, cappedDelay));
      attempt++;
    }
  }

  return null;
}