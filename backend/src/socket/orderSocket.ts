import { Server } from 'socket.io';

export function setupSocketHandlers(io: Server): void {
    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // ── Join restaurant room (staff/kitchen) ───────────────────────────────
        socket.on('join:restaurant', (restaurantId: string) => {
            socket.join(`restaurant:${restaurantId}`);
            console.log(`[Socket] ${socket.id} joined restaurant:${restaurantId}`);
        });

        // ── Join order room (customer tracking) ───────────────────────────────
        socket.on('join:order', (orderId: string) => {
            socket.join(`order:${orderId}`);
            console.log(`[Socket] ${socket.id} joined order:${orderId}`);
        });

        // ── Kitchen: update order status directly via socket ──────────────────
        // (Alternative to REST call – router still handles the DB update via REST)
        socket.on('kitchen:updateStatus', ({ orderId, status, restaurantId }) => {
            // Broadcast to the restaurant room & the specific order room
            io.to(`restaurant:${restaurantId}`).emit('order:statusUpdated', { orderId, status });
            io.to(`order:${orderId}`).emit('order:statusUpdated', { orderId, status });
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });
}
