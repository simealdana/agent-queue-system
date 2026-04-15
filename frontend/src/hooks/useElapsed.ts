import { useState, useEffect } from 'react';

const getNow = (): number => Date.now();

export const useElapsed = (startDate: string | null, isActive: boolean): string => {
  const [now, setNow] = useState(getNow);

  useEffect(() => {
    if (!isActive || !startDate) return;
    const id = setInterval(() => setNow(getNow), 1000);
    return (): void => clearInterval(id);
  }, [isActive, startDate]);

  if (!startDate) return '';

  const ms = now - new Date(startDate).getTime();
  if (ms < 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};
