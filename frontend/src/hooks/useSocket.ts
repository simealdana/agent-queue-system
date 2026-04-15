import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';

/**
 * Connects a single socket.io client and invalidates React Query caches
 * whenever the server pushes workflow/step updates.
 */
export function useSocket(): void {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('workflow:update', () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    });

    socket.on('step:update', () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}
