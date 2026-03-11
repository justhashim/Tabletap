import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000', {
            transports: ['websocket'],
            autoConnect: true,
        });
    }
    return socket;
}

export function joinOrderRoom(orderId: string) {
    getSocket().emit('join:order', orderId);
}

export function onOrderStatusUpdate(
    handler: (data: { orderId: string; status: string }) => void
) {
    getSocket().on('order:statusUpdated', handler);
    return () => getSocket().off('order:statusUpdated', handler);
}
