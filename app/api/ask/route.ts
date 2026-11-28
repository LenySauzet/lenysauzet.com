import { checkBotId } from 'botid/server';

import { answer } from '@/lib/assistant/answer';
import { currentCorpus } from '@/lib/assistant/corpus';
import { readEnv } from '@/lib/assistant/env';
import { botCheckOf, failureOf, limiterOf, refuse } from '@/lib/assistant/guard';
import { modelOf } from '@/lib/assistant/model';
import { parseAskRequest } from '@/lib/assistant/request';

export const maxDuration = 30;

const env = readEnv();
const limiter = limiterOf(env);
const isBot = botCheckOf(env, checkBotId);

export async function POST(request: Request) {
  const failure = await failureOf(request, { env, isBot, limiter });
  if (failure) return refuse(failure);

  const parsed = parseAskRequest(await request.json().catch(() => undefined));
  if (!parsed.success) return refuse('invalid');

  const corpus = await currentCorpus().catch(() => undefined);
  if (!corpus) return refuse('unavailable');

  return answer({ request: parsed.data, corpus, model: modelOf(env.ASK_MODEL), signal: request.signal });
}
