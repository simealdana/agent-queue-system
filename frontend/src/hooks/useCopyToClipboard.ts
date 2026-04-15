import { useState, useCallback } from 'react';

interface CopyState {
  copied: boolean;
  copy: (text: string) => void;
}

export const useCopyToClipboard = (resetMs = 2000): CopyState => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text: string): void => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), resetMs);
  }, [resetMs]);

  return { copied, copy };
};
