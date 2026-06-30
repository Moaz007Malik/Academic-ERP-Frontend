import { useState, useCallback, useRef } from 'react';

/**
 * Prevents double-submit: disables while async fn runs and ignores concurrent calls.
 */
export function useAsyncSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const lockRef = useRef(false);

  const run = useCallback(async (fn) => {
    if (lockRef.current) return { skipped: true };
    lockRef.current = true;
    setSubmitting(true);
    try {
      const result = await fn();
      return { skipped: false, result };
    } finally {
      lockRef.current = false;
      setSubmitting(false);
    }
  }, []);

  return { submitting, run };
}
