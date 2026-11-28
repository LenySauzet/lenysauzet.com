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
  `streaming`, `error`) are the Vercel AI SDK's, and like `useChat` it adds the reply
  only with its first words: the thinking row is drawn from `isThinking`, never from
  an empty message. The real backend replaces its body, nothing else.
  `lib/ask/demo.ts` is the stand-in; its sentences are in `messages/` (`Ask.demo`).
  Beside them it gives `step`, `failure` and `stop` (`useChat`'s, keeping what was
  written). A `step` is a key (`Step`), never text: the server's transient `data-status`
  part names it and `Ask.steps` words it in the visitor's language, shown and announced
  instead of "Thinking…" until the first words.
- **Stop is the send button while an answer is on its way**: it ignores the second click
  of a double click (it lands there just after sending), gives the field its focus back,
  and a question stopped before its first words says so and offers a retry.
- **A refusal is a `Failure`** (`disabled`, `rate-limited`, `unavailable`, `invalid`,
  the codes `/api/ask` answers with), each with its sentence in `Ask.errors`;
  `remediesOf` decides what follows it: a retry only for `unavailable`, a call and an
  email for `unavailable` and `disabled`. An error without a code is `unavailable`.
- **The visitor is told it is an AI** (AI Act, article 50): the header reads "AI
  version of Lény · can be wrong", and the log opens on a sentence that also says this
  site does not keep conversations. That sentence must stay true: `/api/ask` never
  stores text. The header wraps rather than truncates: "can be wrong" is the part a
  phone would cut.
- **`useWake` decides when the bar is open**: at the top or bottom of the page, under
  reduced motion, while it holds focus, text or an open conversation, when the cursor
  comes near (`lib/ask/zones.ts`: a narrow band wakes it, a wider one keeps it, so it
  does not flicker at the edge), and on a phone while the page scrolls up
  (`lib/ask/travel.ts`, past a threshold so iOS's bounce does not flicker it). Each
  opening replays the entrance, the placeholder written twice and the rim's shine
  sweeping with it, except on a phone after the first: there it reopens already
  written. Its effect cleans up after itself: Strict Mode mounts it twice.
- **Escape closes one layer**: the conversation first, keeping focus in the field, then
  the field. Closing from the keyboard gives the field back its focus; focusing it from
  outside reopens the conversation it left.
- **Screen readers hear each answer once**: the log is not live (VoiceOver ignores
  `aria-busy` and would read every streamed word); a status line says the step or
  "Thinking…", then the finished answer or the refusal.
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
- **The log stays pinned to the bottom** by a `ResizeObserver` on the log and its
  content while sticking; any upward wheel, touch or key releases it, the bottom catches
  it again. "Jump to latest" glides there with Motion: a native smooth scroll is
  overwritten by the next pin.
- **Enter sends unless a composition is open**, and Safari confirms an IME composition
  with an Enter whose `isComposing` is false but whose `keyCode` is 229: both are checked.
- **The placeholder keeps one span per letter at rest**, as while it writes itself:
  Safari does not kern across elements, so a single run at the end tightened the text
  and it jumped left.
- **Dictation stops when the question is sent**, or its next result would write the
  sent text back into the emptied field; what was typed before is kept only from the
  click that starts it.
- **The bar is hidden in production** until it answers for real (`askEnabled`):
  `ASK_ENABLED=true` shows it there, `false` hides it everywhere. Setting it before V1
  ships the scripted replies, which answer every other question with the Tolk.ai one.
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
  top from the bottom of the viewport plus the hot topics when shown, on every frame of
  its own animation and on every resize, and the island's `bottom` adds to it.
- **The capsule's hit area is 44px**, drawn by a pseudo-element only while it is tiny:
  over the open bar it would swallow taps meant for the field.
- **Tests replace `AnimatePresence`**: Motion's exits never finish under fake timers.
