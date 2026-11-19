import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getKitchenSocket(restaurantId: string): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket!.emit('join:restaurant', restaurantId);
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
