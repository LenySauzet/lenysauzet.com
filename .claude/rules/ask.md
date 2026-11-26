---
paths:
  - 'app/_components/Home/Ask/**'
  - 'lib/ask/**'
  - 'lib/orb/**'
  - 'app/_components/Island/Island.tsx'
---

# Ask

The assistant on the home page: a capsule at the foot of the screen that opens into a
glass bar, then into a conversation. Answers are scripted for now.

## Shape

- **`useConversation` is the only seam to the model.** Its messages, parts
  (`text`, `source-url`, `data-action`) and statuses (`ready`, `submitted`,
  `streaming`) are the Vercel AI SDK's, so the real backend replaces its body, nothing
  else. `lib/ask/demo.ts` is the stand-in; its sentences are in `messages/` (`Ask.demo`).
- **`useWake` decides when the bar is open**: at the top or bottom of the page, under a
  coarse pointer, under reduced motion, while it holds focus or text or a conversation,
  and when the cursor comes near (`lib/ask/zones.ts`: a narrow band wakes it, a wider one
  keeps it, so it does not flicker at the edge). Every opening replays the entrance:
  the placeholder written twice, the rim's shine sweeping right to left with it. Its
  effect cleans up after itself: Strict Mode mounts it twice.
- **The orb** is one WebGL context for every orb on the page (`lib/orb/renderer.ts`):
  browsers cap contexts, and a long conversation would open one per answer. The thinking
  glow is a canvas painted from `lib/orb/glow.ts`, inverted in the light theme.

## What the code does not say

- **Only the messages animate their height.** `Fit` measures its content and eases to
  it; the conversation follows its messages without a transition of its own once open.
  Two eased heights in a chain lag each other into a jump.
- **Messages clip with `overflow: clip`, never `clip-path`**: clipped content still
  counts in the log's scroll height under `clip-path`, so the log scrolled mid-arrival
  and the first bubble bounced. `overflow-clip-margin` lets a blurred entrance breathe
  (not in WebKit, which clips it square).
- **The log stays pinned to the bottom** by a frame loop while sticking; any upward
  wheel, touch or key releases it, the bottom catches it again. "Jump to latest" glides
  there with Motion: a native smooth scroll is overwritten by the pin on the next frame.
- **`--fade` is registered with a `px` initial value**: a `rem` one is rejected, and an
  unregistered property does not interpolate, so the log's bottom fade snapped.
- **No `mix-blend-mode` over the glass**: it isolates the panel and its backdrop blur
  stops seeing the page.
- **The capsule closes on a spring that does not overshoot** (`SETTLE`): the island's
  `MORPH` would crush its 10px into a line.
- **Hover and press change the bar's width by whole pixels**, never `scale`: a scaled
  1px rim lands between pixels and dims.
- **The field is 16px below `sm`**: iOS zooms into a smaller one on focus.
- **On phones the island sits above the bar**: the bar publishes `--ask-clearance`, its
  top from the bottom of the viewport, and the island's `bottom` adds to it.
- **Tests replace `AnimatePresence`**: Motion's exits never finish under fake timers.
