import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// In-memory store for SSE connections (in production, use Redis)
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export const GET: RequestHandler = async ({ url }) => {
  const roomCode = url.searchParams.get('roomCode');
  const userId = url.searchParams.get('userId');

  if (!roomCode || !userId) {
    return new Response('Missing roomCode or userId', { status: 400 });
  }

  // Create a new ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Get or create room connections
      if (!connections.has(roomCode)) {
        connections.set(roomCode, new Set());
      }
      connections.get(roomCode)!.add(controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:ping\n\n`));
        } catch (err) {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Cleanup on close
      return () => {
        clearInterval(pingInterval);
        const roomConnections = connections.get(roomCode);
        if (roomConnections) {
          roomConnections.delete(controller);
          if (roomConnections.size === 0) {
            connections.delete(roomCode);
          }
        }
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable Nginx buffering
    }
  });
};

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