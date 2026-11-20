import 'server-only';

import { execSync } from 'node:child_process';

function git(args: string) {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || undefined;
  } catch {
    return undefined;
  }
}

const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? git('rev-parse HEAD');
const updated = new Date(git('log -1 --format=%cI') ?? Date.now());

export const buildInfo = {
  commit: commit?.slice(0, 7),
  commitUrl: commit && `https://github.com/LenySauzet/lenysauzet.com/commit/${commit}`,
  updated: updated.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'Europe/Paris' }),
};
