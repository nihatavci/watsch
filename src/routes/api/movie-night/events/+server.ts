import type { RequestHandler } from '@sveltejs/kit';
import { addConnection, removeConnection } from '$lib/utils/movie-night-sse';

export const GET: RequestHandler = async ({ url }) => {
  const roomCode = url.searchParams.get('roomCode');
  const userId = url.searchParams.get('userId');

  if (!roomCode || !userId) {
    return new Response('Missing roomCode or userId', { status: 400 });
  }

  // Create a new ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to the room
      addConnection(roomCode, controller);

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
        removeConnection(roomCode, controller);
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