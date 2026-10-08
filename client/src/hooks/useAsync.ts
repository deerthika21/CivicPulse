import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  /** Re-run; `silent` keeps current data on screen (background refresh). */
  reload: (silent?: boolean) => void;
  setData: (d: T) => void;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(
    (silent = false) => {
      const id = ++seq.current;
      if (!silent) setLoading(true);
      fn()
        .then((d) => {
          if (id !== seq.current) return;
          setData(d);
          setError(null);
        })
        .catch((e: Error) => {
          if (id === seq.current) setError(e);
        })
        .finally(() => {
          if (id === seq.current) setLoading(false);
        });
    },
    deps, // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    run();
  }, [run]);

  return { data, error, loading, reload: run, setData };
}
