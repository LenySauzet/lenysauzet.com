import type { FrameEvent } from '@/lib/presence/frames';
import type { Layout, Marks, Path, ServerMessage } from '@/lib/presence/protocol';

import type { RemoteCursors } from './remote-cursors';
import type { RemoteHighlights } from './remote-highlights';

type Cursors = Pick<
  RemoteCursors,
  'move' | 'press' | 'release' | 'click' | 'pull' | 'drop' | 'leave' | 'remove' | 'keepOnly'
>;
type Highlights = Pick<RemoteHighlights, 'show' | 'hide' | 'keepOnly'>;

interface RoomStateOptions {
  cursors: Cursors;
  highlights: Highlights;
  frames: { receive: (event: FrameEvent) => void };
  layoutNow: () => Layout;
}

const NOBODY = new Set<string>();

export function createRoomState({ cursors, highlights, frames, layoutNow }: RoomStateOptions) {
  const paths = new Map<string, Path>();
  const selections = new Map<string, Marks>();
  const pulling = new Map<string, string>();
  let own = layoutNow();

  const alike = (id: string) => paths.get(id)?.layout === own;

  const letGo = (id: string) => {
    const frame = pulling.get(id);
    if (frame) frames.receive({ type: 'drop', frame });
    pulling.delete(id);
  };

  const letGoAll = () => {
    for (const id of [...pulling.keys()]) letGo(id);
  };

  const showSelection = (id: string) => {
    const marks = selections.get(id);
    if (marks?.layout === own) highlights.show(id, marks);
    else highlights.hide(id);
  };

  const place = (id: string, path: Path) => {
    paths.set(id, path);
    if (alike(id)) cursors.move(id, path);
    else {
      cursors.remove(id);
      letGo(id);
    }
  };

  const reset = () => {
    letGoAll();
    paths.clear();
    selections.clear();
    cursors.keepOnly(NOBODY);
    highlights.keepOnly(NOBODY);
  };

  const receive = (message: ServerMessage) => {
    switch (message.type) {
      case 'snapshot':
        reset();
        for (const { id, path } of message.cursors) place(id, path);
        for (const { id, marks } of message.highlights) {
          selections.set(id, marks);
          showSelection(id);
        }
        return;
      case 'move':
        return place(message.id, message.path);
      case 'press':
        return cursors.press(message.id);
      case 'release':
        return cursors.release(message.id);
      case 'click':
        return cursors.click(message.id);
      case 'leave':
        return cursors.leave(message.id);
      case 'gone':
        cursors.remove(message.id);
        letGo(message.id);
        paths.delete(message.id);
        selections.delete(message.id);
        return highlights.hide(message.id);
      case 'highlight':
        selections.set(message.id, message.marks);
        return showSelection(message.id);
      case 'unhighlight':
        selections.delete(message.id);
        return highlights.hide(message.id);
      case 'pull':
        if (alike(message.id)) cursors.pull(message.id, message.pull);
        return;
      case 'drop':
        return cursors.drop(message.id, message.frame);
    }
  };

  return {
    receive,
    framed(id: string, event: FrameEvent) {
      if (event.type === 'pull') pulling.set(id, event.pull.frame);
      else if (pulling.get(id) === event.frame) pulling.delete(id);
      else return;
      frames.receive(event);
    },
    regroup() {
      own = layoutNow();
      for (const [id, path] of paths) {
        if (alike(id)) cursors.move(id, { ...path, samples: path.samples.slice(-1) });
        else {
          cursors.remove(id);
          letGo(id);
        }
      }
      for (const id of selections.keys()) showSelection(id);
    },
    reset,
    dispose: letGoAll,
  };
}
