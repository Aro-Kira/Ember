import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }, []);

  return { toast, showToast };
}

export default useToast;
