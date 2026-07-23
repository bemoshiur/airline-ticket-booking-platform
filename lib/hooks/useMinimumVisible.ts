import { useEffect, useRef, useState } from "react";

export function useMinimumVisible(isLoading: boolean, minMs = 350): boolean {
  const [show, setShow] = useState(isLoading);
  const startRef = useRef(isLoading ? Date.now() : 0);

  useEffect(() => {
    if (isLoading) {
      startRef.current = Date.now();
      setShow(true);
      return;
    }

    const remaining = Math.max(0, minMs - (Date.now() - startRef.current));
    const id = setTimeout(() => setShow(false), remaining);
    return () => clearTimeout(id);
  }, [isLoading, minMs]);

  return show;
}
