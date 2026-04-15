import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export const useSocket = (): void => {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    const invalidate = (): void => {
      void queryClient.invalidateQueries({ queryKey: ['workflows'] });
    };

    socket.on('workflow:update', invalidate);
    socket.on('step:update', invalidate);

    return (): void => {
      socket.disconnect();
    };
  }, [queryClient]);
};
