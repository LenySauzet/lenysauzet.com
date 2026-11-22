export { Room } from './room';

const ROOMS: Record<string, string> = { '/': 'portfolio', '/fr': 'portfolio-fr' };

export default {
  async fetch(request, env) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });

    const origin = request.headers.get('Origin');
    if (!origin || !env.ALLOWED_ORIGINS.split(',').includes(origin)) return new Response('Forbidden', { status: 403 });

    const room = ROOMS[new URL(request.url).pathname];
    if (!room) return new Response('Not found', { status: 404 });

    return env.ROOM.getByName(room).fetch(request);
  },
} satisfies ExportedHandler<Env>;
