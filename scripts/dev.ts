import { spawn, type ChildProcess } from 'node:child_process';

const PRESENCE_PORT = '8787';

const children: ChildProcess[] = [
  spawn('bun', ['run', 'dev', '--port', PRESENCE_PORT], {
    cwd: 'workers/presence',
    stdio: ['ignore', 'inherit', 'inherit'],
  }),
  spawn('next', ['dev', ...process.argv.slice(2)], {
    env: { ...process.env, NEXT_PUBLIC_PRESENCE_URL: `ws://localhost:${PRESENCE_PORT}` },
    stdio: 'inherit',
  }),
];

let stopping = false;

const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
};

for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => stop());
for (const child of children) child.on('exit', (code) => stop(code ?? 1));
