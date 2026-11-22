import 'server-only';

import { execSync } from 'node:child_process';

import siteConfig from '@/config/site';

const localCommit = () => {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return undefined;
  }
};

const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? localCommit();

export const buildInfo = {
  commit: commit && { short: commit.slice(0, 7), url: `${siteConfig.repository}/commit/${commit}` },
  builtAt: new Date(),
};
