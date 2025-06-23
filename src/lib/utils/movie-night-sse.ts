// In-memory store for SSE connections (in production, use Redis)
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Helper function to broadcast events to all connected clients in a room
export function broadcastToRoom(roomCode: string, event: any) {
  const roomConnections = connections.get(roomCode);
  if (!roomConnections) return;

  const encoder = new TextEncoder();
  const data = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

  for (const controller of roomConnections) {
    try {
      controller.enqueue(data);
    } catch (err) {
      // Controller might be closed, remove it
      roomConnections.delete(controller);
    }
  }
}

// Function to add a connection to a room
export function addConnection(roomCode: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(roomCode)) {
    connections.set(roomCode, new Set());
  }
  connections.get(roomCode)!.add(controller);
}

// Function to remove a connection from a room
export function removeConnection(roomCode: string, controller: ReadableStreamDefaultController) {
  const roomConnections = connections.get(roomCode);
  if (roomConnections) {
    roomConnections.delete(controller);
    if (roomConnections.size === 0) {
      connections.delete(roomCode);
    }
  }
}

// Function to get the number of connections in a room
export function getRoomConnectionCount(roomCode: string): number {
  const roomConnections = connections.get(roomCode);
  return roomConnections ? roomConnections.size : 0;
} 