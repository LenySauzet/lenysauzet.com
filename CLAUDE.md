# CLAUDE.md

The portfolio at lenysauzet.com: one page, an island, a command palette and the work.
Its sibling is the blog (`../blog.lenysauzet.com`), whose components this one adapts
rather than imports. `AGENTS.md` points here.

## Commands

```bash
bun dev
portless             # The same, at https://lenysauzet.localhost
bun run build
bun lint
bun run type-check
bun run test          # Vitest; `bun test` is Bun's own runner and will not work
```

The presence worker is its own package, with its own lockfile, run from
`workers/presence`: `bun run dev` (wrangler on port 8787, its local origins in
`.dev.vars`), `bun run type-check`, `bun run test` (Vitest inside the Workers runtime,
on production bindings), and `bun run deploy`, which only the owner runs or approves.
At the root, `bun run dev:presence` is `next dev` pointed at that local worker.

## Verification gate

`bun lint && bun run type-check && bun run test && bun run build`, exactly what
`.github/workflows/ci.yml` runs, on the Bun `packageManager` names, plus the worker's
type-check and tests. Then look at both
themes, at phone and desktop widths, in Chromium and in WebKit.

## Writing style

English, single quotes, trailing commas, no em dash. **No comments in the code**:
names, types and structure carry the meaning, and every trap is written down here
instead. Never run `prettier` on a directory, only `--single-quote` on exact paths.

## Layout and conventions

Next.js 16 App Router. Every page is static; `/resume` alone runs on request. Server
Components by default, `'use client'` only for state, effects or browser APIs.

- **`app/_components/`** is what the pages share (Island, CommandPalette, Footer,
  StatusPage, HomeLink, ResumeAnchor, ThemeColor, the error body, `document.ts`, the
  fonts and body classes the root layout and `global-error` both need), and `Home/` the
  home page. A component with parts is a folder with an `index.ts`; a single file stays
  flat.
- **`components/`** is what is not tied to a page: `ui/` the shadcn primitives,
  `icons/` the animated icons, `shared/` the logo, the hatching, the selection frame and
  `styles.ts`, the class strings several places compose (`focusRing`, `pillSurface`,
  `pageGrid`).
- **`lib/`** is logic, by domain (`commands/`, `media/`, `seo/`, `services/`, `theme/`),
  with what every domain uses at its root (`utils`, `motion`, `masonry`, `browser`,
  `build-info`). It never imports from `app/`.
- **`hooks/`** holds the Zustand stores and the hooks shared across components.
- **`workers/presence/`** is the Cloudflare Worker behind the live cursors, deployed on
  its own; the app's type-check and tests leave it out, its own run it. The wire
  protocol both sides speak is `lib/presence/protocol.ts`, pure and dependency-free so
  the worker can import it.
- **`content/`** is what the page shows, typed, by hand; **`config/site.ts`** the
  identity, links and handles everything else derives from.
- Named exports everywhere but where Next.js asks for a default, and `siteConfig`.
  Every component accepts and forwards `className`. Hugeicons only, `motion/react`
  only, tokens only.
- Tests sit beside their file, run in jsdom with reduced motion on unless a test asks
  otherwise (`test/media.ts`), and every one was proved by breaking what it guards.

| Path | What it owns |
|---|---|
| `config/site.ts` | Identity, handle, time zone, links, profiles, the resume, cal.com |
| `content/projects.ts`, `content/clients.ts` | The work and the logos; a client may be the employer |
| `lib/masonry.ts` | Tiles into columns, shortest first, and the lane contract the footer reads |
| `lib/media/probe.ts` | An image's size and a 16px blur placeholder, read with sharp at build time |
| `lib/media/cdn.ts` | A bare media path to its URL under `portfolio/` on the CDN |
| `lib/commands/` | The palette's registry, its groups, and how a key chord maps to a command |
| `lib/services/` | cal.com's modal; the resume's route, anchor and announcement |
| `lib/seo/structured-data.ts` | The `Person` and `ProfilePage` JSON-LD |
| `lib/theme/` | The view-transition sweep, and the stored theme `global-error` reads |
| `lib/build-info.ts` | The commit and build date the footer shows |
| `hooks/use-island-store.ts` | What the island presents, as data, and `announce` |
| `hooks/use-palette-store.ts` | Whether the palette is wanted, open, and handing focus back |
| `lib/presence/` | The cursors' wire protocol, anchors, motion maths, highlight lines, the frame channel and reconnecting socket |
| `hooks/use-presence-store.ts` | Whether this visitor hides the others' cursors, kept in the browser |
| `workers/presence/` | The worker: one Durable Object room, its rate budget, its tests |
| `hooks/use-animated-icon.ts` | The animated icons' controls, and playing one from its control |

## What the code does not say

- **The island renders data.** Its store holds presences (`hint`, `announcement` with
  its message and icon), never markup, so `lib/` announces without reaching into
  `app/`; `views.tsx` turns each into its pill. An announcement also lands in an
  `sr-only` `role="status"`, emptied and refilled a task later so the same message,
  repeated, is read again. The hint names the modifier of the visitor's platform.
- **The palette loads on intent.** `PaletteLauncher` holds the keyboard and mounts the
  palette through `next/dynamic` once it is `wanted`: pointing at or focusing the island,
  or opening it. A shortcut runs its command without loading it. Shortcuts are ⌘ on
  Apple systems and Ctrl elsewhere, never both, and ignore a held key, Alt, Shift and a
  composition; a letter is read from `code` when the layout's `key` is not Latin. ⌘D, ⌘S
  and ⌘L take over the browser's own, as on the blog, on purpose.
- **A picked command runs once focus is back**, from the dialog's `onClosed`, which
  Radix fires after the exit: focus returns first, without scrolling, under
  `returningFocus` (which keeps the island from reading it as pointing), then the
  command runs, so "Go to top" is not undone and cal.com opens over a settled page.
  Reopening before the exit ends forgets the pick. Radix has no trigger to hand focus
  back to, so the dialog notes what held it on opening.
- **`ui/command.tsx` is the blog's**, not the CLI's: glass panel, Motion dialog that
  travels its backdrop blur, a bare 16px input below `sm` (iOS zooms under it), rows
  selected only under a fine pointer or the keyboard (`data-keyed`), a leaving dialog
  `inert`. `FadingList` fades the list's ends. Its input is named `search`: password
  managers offer themselves on a text field despite `autocomplete="off"`, and cmdk
  forces `type="text"`.
- **The masonry is decided at build time.** Each image is probed (timing out to a 16:9
  fallback and a warning rather than failing the build), the tiles are spread one, two
  and three columns wide, and CSS shows the layout for the width, so nothing moves on
  load. The DOM, and so Tab and a screen reader, runs column by column: masonry without
  it is CSS `grid-lanes`, to adopt once every engine ships it. The three copies are the
  price of a static layout; hidden ones are `display: none`, and their lazy images are
  never fetched.
- **A project is a still, and maybe a video**, with at most one action: an article, an
  app or its code. The still is always probed and stays under the video, which plays
  muted only while a quarter of it is in view, never under reduced motion. Each medium
  arrives out of blur over the placeholder once loaded or playing; next/image replays a
  load or error from before hydration. A failed image leaves hatching and an icon.
  `video` and articles wait for content: no project uses them yet. A card's link is
  named after its project, and says when it opens a new tab.
- **Entrances are the 404's**: `rise` staggered by `--rise-step` in the hero, `Reveal`
  on each card as it enters the view. `Reveal` animates blur and opacity only, which
  Motion runs on the compositor; a translate ran on the main thread and stuttered
  through hydration. Its initial state never depends on the reader's preference, which
  the server cannot know: reduced motion only makes the entrance instant.
- **The CTA pills share `pillSurface`**: `rounded-xl`, never full, so they do not echo
  the island; `glass-rim` for the top-lit border, `--shadow-pill` per theme, no
  background change on hover. On a `1fr auto 1fr` grid, Email centred, "Book a call"
  grows leftwards and the other two never move. Its "+ You" scales from 0 at its left
  edge on the curve and duration of the space opening, unclipped, so it fills the gap
  as it grows. The space is an explicit width (`w-13`, the pair's own), not a `0fr`
  track: WebKit sizes a collapsed track from its unclipped content. Below `sm` or under
  a coarse pointer it is shown grown and spans the row.
- **Animated icons are Hugeicons Animated** (community, MIT), added with
  `bunx --bun shadcn@latest add @hugeicons-animated/<name>` and then rewritten into
  `components/icons/`: `ref` as a prop, one shared handle, no hover of their own. An
  icon plays when its whole control is hovered or focused, through `useAnimatedIcon`.
- **The theme changes under the blog's sweep** (`withThemeTransition`), and
  `ThemeColor` copies the body's background into `theme-color` a frame after each
  change, so the browser's chrome follows the site's theme, not the system's.
- **Client logos are shadcn `Avatar`s.** `BookingButton` runs the handler a Radix
  `asChild` trigger merges into it before its own, or the tooltip's would replace it and
  "Your company next?" would open nothing. The trigger is an unscaled wrapper and only
  the avatar inside it grows: Radix measures the trigger with its transform. The
  tooltips take `disableHoverableContent`, or a pointer leaving through one held it
  open over the next avatar. Until a logo is on the CDN the initial shows.
- **The shine is CSS alone**: a registered `--sweep` animated in `@keyframes`, painted
  through `shine-text` and `shine-border`. The text's band dims in dark and lightens in
  light (`--shine-text`), the rim's is `--shine-rim`. Reduced motion parks it.
- **The status pages share `StatusPage`**: the status as a hairline outline of
  Departure Mono (stroked at twice its width, then covered by the same text in
  `--background`, so only the outer half shows), the serif title, the copy, faded
  bands. `global-error` replaces the root layout, so it brings the fonts and applies
  the stored theme itself. The 404 declares no canonical URL.
- **The footer is a metadata block**: commit, browser, the local time, the window, the
  build date and the source repository, then links. The live readings use
  `useSyncExternalStore` with a pending server snapshot; the clock ticks on the second.
  Its bands rise to their own column: `RisingBand` reads where the masonry's first or
  last lane ends and stays hidden until it has, so on a page without the work they
  never show.
- **The home page carries JSON-LD**: a `Person` at `https://lenysauzet.com/#person`,
  every spelling of the name, `sameAs` each profile and the blog, inside a
  `ProfilePage`. The blog should point its author at that `@id`.
- **Live cursors are anonymous, desktop only, and on the home page only.** A visitor
  with a fine pointer loads the room's code on demand and opens one WebSocket to the
  presence worker (`siteConfig.presenceUrl`: `wss://presence.lenysauzet.com` on
  Vercel's production only, `NEXT_PUBLIC_PRESENCE_URL` anywhere, nothing otherwise, so
  previews and local builds never knock on a door that refuses them). Its single
  Durable Object room relays positions to everyone else and keeps each visitor's last
  point and last activity in the socket attachment, so a newcomer gets a snapshot and
  the room can hibernate; no IP or name is kept, the address being hashed into an
  in-memory tag only to cap it at four sockets. The room holds 24 and lets the idlest
  go with close code 4000 to make room, which the client honours by staying down until
  its own pointer moves; a hidden tab closes its socket the same way. Messages over
  320 characters, unreadable, or beyond a burst of 120 at 75 a second are dropped
  unread. "leave" means the pointer left the page (or is scrolling) and keeps the
  visitor's highlight; "gone" means the socket closed and clears both, and lets go of
  any frame that visitor held. "Toggle cursors", offered only to a fine pointer,
  closes the socket and is remembered.
- **The room still completes the close handshake itself.** The compatibility date makes
  the runtime reply to a Close frame, yet under local wrangler sockets stayed CLOSING
  until `webSocketClose` called `close()`; the call is harmless where it is ignored.
- **A cursor moves on its anchor and lands on its detail.** Anchors are leaves, never
  nested: `role`, `headline`, `intro`, `actions`, `clients`, each `project:<slug>`,
  `metadata`, `links`. Each sample is a place on one anchor: the fraction of its box at
  the closest point on its edge plus the pixels beyond, the anchor being the one under
  the pointer, else the one last left (held across empty space until another is
  entered), else the nearest. That path is continuous inside an anchor and through
  gaps, so the motion stays the owner's. The latest sample also carries a detail when
  the pointer is on something finer: the character under it (`#index`, found with
  `caretPositionFromPoint`, else `caretRangeFromPoint` for older Safari, kept only when
  its box holds the pointer) or the deepest element (a path of child indices; the
  masonry copies share one tree). The receiver adds the gap between the detail and the
  path, weighted by how slowly the path moves (full below 0.45 px/ms is approached as
  the pace falls, damped over 110 ms): a sweep follows the path, and a pointer that
  slows, hovers, selects or clicks settles on the same letter or button. The pace is
  the path's own, never the drawn cursor's, or the correction would slow itself.
  Following the detail at full speed made a cursor jump back each time a line wrapped
  differently; picking the nearest anchor at each sample made it jump in every gap. A
  cursor still crosses the page when its owner enters an element that sits elsewhere
  on this layout: that is where they are.
- **Moves travel in batches.** The pointer is sampled on every `pointermove` and sent
  every 33 ms as up to four samples, each with its age, all on the anchor of the
  latest; a press or a release flushes the batch first, so it lands where it
  happened. The receiver places samples at arrival minus age and plays them behind
  real time by a `Cadence` delay, the measured interval between batches plus 2.5 times
  its jitter (40 to 160 ms): enough to always hold the next sample, no more. It learns
  only from batches that continue a motion (a gap under 250 ms and an oldest sample at
  least 10 ms old): the batch that ends a pause would otherwise read as network jitter
  and push the delay to its ceiling. Presses,
  clicks and frame pulls replay on the same delay so they meet the cursor. While its
  page scrolls the own cursor is not sent but leaves, and comes back where it settled
  160 ms later: sending through a scroll drew others a straight line across the page.
- **A selection is shared as characters of an anchor.** `spanOf` counts the
  characters before each end within the anchor holding its start (or its end), keeping
  the part inside; `rangeOf` walks the text nodes of the shown copy back to a range.
  `remote-highlights` animates the shown ends towards the shared ones in characters,
  fractions included, so a selection sweeps along the text: the background is drawn as
  one rounded rectangle per line in a layer on `body` (document coordinates, under the
  island at `z-40`), its ends trimmed by the uncovered part of their character; the
  text takes the hue through a `::highlight()` rule per visitor on the whole characters
  covered. A cleared selection folds back to its start as it fades. `DOMRect` fields
  are getters on its prototype, so `{ ...rect }` copies nothing: `linesFor` copies them
  by name.
- **The cursors live in the top layer**, a `popover="manual"` shown on mount, which
  sits above every z-index (the island, the palette, cal.com's modal at its maximum)
  and is fixed to the viewport, so the loop subtracts the scroll.
- **The others' cursors move in one frame loop, outside React.** React only adds and
  removes them (with an entrance in opacity, scale and blur); each frame reads the
  path through Catmull-Rom curves at the cadence delay, damps it lightly (28 ms), and
  writes the transform: a tilt and a directional SVG blur from the damped velocity,
  four ghosts along the last 56 ms of the drawn path that fade in with speed (motion
  blur as a shutter would record it), and a scale on a light spring (`spring`, fixed
  1 ms steps, so any frame rate moves alike) held down between a press and its release
  (released anyway after 4 s). A cursor sinks to a trace after 1 s still and comes back
  as it moves or presses; a timer wakes the stopped loop for that fade. The loop stops once everything is at rest and wakes on a
  message, a scroll, a resize, or a press due to time out. Ten cursors at most are
  shown: the rest wait for a place to free rather than taking one, which would churn
  React at the message rate, and their presses are dropped. Each frame reads every box
  first, then writes, and ripples last; a cursor this page cannot place is skipped
  without keeping the loop awake.
- **Cursors step aside for a modal.** `lib/presence/overlays.ts` watches the palette
  (Radix locks the page with `data-scroll-locked` on `body`) and cal.com's
  `cal-modal-box`, open unless its `state` is `closed` or its inline `visibility` is
  `hidden`: its close button hides it and leaves the state `loaded`. While one is open the others'
  cursors and highlights fade out, and the own cursor leaves and is not sent: the page
  under the modal is not what its owner is looking at. Reduced motion keeps the path and drops the tilt, blur,
  ghosts, spring and ripple.
- **A click ripples the page under it (an experiment).** A click is a press released
  within 350 ms and 8 px, leaving no selection, so selecting text or dragging never
  ripples; the own clicks ripple too, the island's and the palette's included (a modal
  stops the cursor being shared, not the clicks rippling). The ripples have their own
  popover, shown after the cursors' and never faded with it: the island opens the
  palette and "Book a call" opens cal.com, both of which hide the cursors' layer, and
  their clicks' ripples went with it. Clicks inside cal.com's iframe never reach the
  page, so they cannot ripple. The ripple is an element in that layer at the click, its `backdrop-filter` an SVG filter, so it bends
  whatever lies beneath, across cards, buttons and the island: a ring displacement map
  drawn once on a canvas, laid over a neutral grey flood (an `feImage` leaves the rest
  of its region transparent black, which would displace everything), grown from the
  centre while its strength fades, and applied three times at different strengths, one
  per colour channel, screened back together for the chromatic aberration. WebKit
  accepts `backdrop-filter: url()` and draws nothing, so Safari gets a ring of
  backdrop blur and saturation instead (`GestureEvent` is how it is told apart, as
  `CSS.supports` says yes). `rise` fills `backwards`, not `both`, so it never pins a
  filter on the hero.
- **The selection frames are pulled like Figma's.** A corner moves its two edges on a
  rubber band (`rubberBand`, the iOS curve, 40 px at most), so the outline stays a
  rectangle; the hatching is 40 px larger than the frame and clipped to the edges, so
  its pattern holds still, and the content is clipped to them while they are off
  rest (`none` at rest, so focus rings are never cut). The frame shares its pulls
  through `lib/presence/frames.ts`, the room sends them with the batch and replays
  others' pulls, which the frame follows on a stiff spring unless held here, letting go
  on a drop or a "gone" only: a pull held still sends nothing, so a timeout let go of
  frames still held. `body` clips horizontal overflow (`clip`,
  not `hidden`, so it creates no scroll container), as a corner pulled at the edge of a
  phone would otherwise widen the page.
- **`/resume` proxies the PDF** so `download` holds across origins; the edge caches it
  a day and a failure is never cached.
- **Images are unoptimized under `next dev`**: on a NAT64 network the CDN resolves to
  `64:ff9b::`, which the optimizer refuses as a private IP. Never set
  `dangerouslyAllowLocalIP`; to look at a local production build, serve the original
  through a Playwright route.

## Branches

One change per branch, PR into `main`, squash-merge. Never commit straight to `main`.
