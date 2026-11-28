const TEXT = new Set(['text-start', 'text-delta', 'text-end']);

const written = <Chunk extends { type: string }>(chunks: Chunk[]) =>
  chunks.some((chunk) => chunk.type === 'text-delta' && 'delta' in chunk && String(chunk.delta).trim() !== '');

export function finalTextOnly<Chunk extends { type: string }>(): TransformStream<Chunk, Chunk> {
  let step: Chunk[] = [];
  let latest: Chunk[] = [];
  let usedTools = false;
  let sent = false;
  const release = (controller: TransformStreamDefaultController<Chunk>, text: Chunk[]) => {
    text.forEach((chunk) => controller.enqueue(chunk));
    sent = true;
    latest = [];
  };
  return new TransformStream({
    transform(chunk, controller) {
      if (chunk.type === 'start-step') {
        step = [];
        usedTools = false;
      }
      if (chunk.type.startsWith('tool-')) {
        usedTools = true;
        return;
      }
      if (TEXT.has(chunk.type)) {
        step.push(chunk);
        return;
      }
      if (chunk.type === 'finish-step') {
        if (written(step)) latest = step;
        if (!usedTools && !sent && written(latest)) release(controller, latest);
        step = [];
      }
      if (chunk.type === 'finish' && !sent && written(latest)) release(controller, latest);
      controller.enqueue(chunk);
    },
    flush(controller) {
      if (!sent && written(latest)) release(controller, latest);
    },
  });
}
