export { Room } from './room';

const ROOM = 'portfolio';

export default {
  async fetch(request, env) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });

    const origin = request.headers.get('Origin');
    if (!origin || !env.ALLOWED_ORIGINS.split(',').includes(origin)) return new Response('Forbidden', { status: 403 });

    return env.ROOM.getByName(ROOM).fetch(request);
  },
} satisfies ExportedHandler<Env>;
