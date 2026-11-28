const TEXT = new Set(['text-start', 'text-delta', 'text-end']);

export function answerOnly<Chunk extends { type: string }>(): TransformStream<Chunk, Chunk> {
  let finishedSteps = 0;
  return new TransformStream({
    transform(chunk, controller) {
      if (chunk.type === 'finish-step') finishedSteps += 1;
      if (chunk.type.startsWith('tool-')) return;
      if (TEXT.has(chunk.type) && finishedSteps === 0) return;
      controller.enqueue(chunk);
    },
  });
}
