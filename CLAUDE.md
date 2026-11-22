# CLAUDE.md

The portfolio at lenysauzet.com: one page, an island, a command palette and the work.
Its sibling is the blog (`../blog.lenysauzet.com`), whose components this one adapts
rather than imports. `AGENTS.md` points here.

## Commands

```bash
bun dev              # The site and the presence worker together
portless             # The same, at https://lenysauzet.localhost
bun run build
bun lint
bun run type-check
bun run test          # Vitest; `bun test` is Bun's own runner and will not work
```

In `workers/presence`, its own package and lockfile: `bun run dev` (wrangler on 8787,
local origins in `.dev.vars`), `bun run type-check`, `bun run test` (inside the
Workers runtime, on production bindings), `bun run deploy`, which only the owner runs
or approves. The root's `bun dev` runs that worker (`dev:presence`) and the site
pointed at it (`dev:site`) in parallel.

## Verification gate

`bun lint && bun run type-check && bun run test && bun run build`, plus the worker's
type-check and tests: exactly what `.github/workflows/ci.yml` runs. Then look at both
themes, at phone and desktop widths, in Chromium and in WebKit.

## Writing style

English, single quotes, trailing commas, no em dash. **No comments in the code**:
names, types and structure carry the meaning, and every trap is written down here
instead. Never run `prettier` on a directory; on exact paths, with `--single-quote
--print-width 120 --trailing-comma es5`, the repo's format.

## Layout and conventions

Next.js 16 App Router, in English at `/` and French at `/fr`: every page lives under
`app/[locale]` and is static; `/resume` alone runs on request. Server Components by
default, `'use client'` only for state, effects or browser APIs. Languages are in
`.claude/rules/i18n.md`, which loads with their files.

- **`app/_components/`** is what the pages share (Island, CommandPalette, PageBlur,
  StatusPage, HomeLink, ResumeAnchor, ThemeColor, OtherVersion, SiteTheme, the error
  body, `document.ts`, the fonts and body classes the root layout and `global-error`
  both need), and `Home/` the home page, its footer included. A component with parts is
  a folder with an `index.ts`; a single file stays flat.
- **`components/`** is what is not tied to a page: `ui/` the shadcn primitives,
  `icons/` the animated icons, `shared/` the logo, the hatching, the selection frame and
  `styles.ts`, the class strings several places compose (`focusRing`, `pillSurface`,
  `pageGrid`).
- **`lib/`** is logic, by domain (`commands/`, `media/`, `presence/`, `seo/`,
  `services/`, `theme/`), with what every domain uses at its root (`utils`, `motion`,
  `masonry`, `browser`, `blur`, `build-info`). It never imports from `app/`.
- **`hooks/`** holds the Zustand stores and the hooks shared across components.
- **`workers/presence/`** is the Cloudflare Worker behind the live cursors, deployed on
  its own; the app's type-check and tests leave it out, its own run it.
- **`content/`** is what the page shows, typed, by hand; **`config/site.ts`** the
  identity, links and handles everything else derives from; **`messages/`** every
  sentence, per language; **`i18n/`** the routing, the request config and the helpers
  between languages.
- Named exports everywhere but where Next.js asks for a default, and `siteConfig`.
  Every component accepts and forwards `className`. Hugeicons only, `motion/react`
  only, tokens only.
- Tests sit beside their file, run in jsdom with reduced motion on unless a test asks
  otherwise (`test/media.ts`), and every one was proved by breaking what it guards.

| Path | What it owns |
|---|---|
| `config/site.ts` | Identity, handle, time zone, links, profiles, each language's resume, cal.com |
| `i18n/`, `messages/` | The languages, their sentences, and the paths between them |
| `content/projects.ts`, `content/clients.ts` | The work and the logos; a client may be the employer |
| `lib/masonry.ts` | Tiles into columns, shortest first, and the lane contract the footer reads |
| `lib/media/probe.ts` | An image's size and a 16px blur placeholder, read with sharp at build time |
| `lib/media/cdn.ts` | A bare media path to its URL under `portfolio/` on the CDN |
| `lib/commands/` | The palette's commands, made per language, their groups, and how a key chord maps to a command |
| `lib/services/` | cal.com's modal; the resume's route and announcement |
| `hooks/use-resume-anchor.ts`, `hooks/use-other-version.ts` | The resume link and the other language, for the page's language |
| `lib/seo/structured-data.ts` | The `Person` and `ProfilePage` JSON-LD |
| `lib/theme/` | The view-transition sweep, and the stored theme `global-error` reads |
| `lib/build-info.ts` | The commit and build date the footer shows |
| `hooks/use-island-store.ts` | What the island presents, as data, and `announce` |
| `hooks/use-palette-store.ts` | Whether the palette is wanted, open, and handing focus back |
| `hooks/use-commands.ts` | The commands in the page's language, with the switch to the other |
| `lib/presence/` | The live cursors' logic: wire protocol, placement, motion, selections, clicks, availability |
| `lib/blur.ts` | The progressive blur's layers: radii stacking to an exponential curve |
| `hooks/use-presence-store.ts` | Whether this visitor hides the others' cursors, kept in the browser |
| `workers/presence/` | The worker: one Durable Object room, its budget, its address grouping |
| `hooks/use-animated-icon.ts` | The animated icons' controls, and playing one from its control |

## What the code does not say

- **The island renders data.** Its store holds presences (`hint`, `announcement` with
  its message, icon and an optional action a click runs in place of the palette), never
  markup, so `lib/` announces without reaching into `app/`; `views.tsx` turns each into
  its pill. An announcement also lands in an `sr-only` `role="status"`, emptied and
  refilled a task later so the same message, repeated, is read again. The hint names the
  modifier of the visitor's platform.
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
  background change on hover. The three are centred on their resting widths, whatever
  the language; "Book a call" grows leftwards by a margin it gives back as it widens, so
  its box, and the other two, never move. Its "+ You" scales from 0 at its left edge on
  the curve and duration of the space opening, unclipped, so it fills the gap as it
  grows. The space is an explicit width (`--you`, the pair's own, and the margin's), not
  a `0fr` track: WebKit sizes a collapsed track from its unclipped content. Below `sm`
  or under a coarse pointer it is shown grown and spans the row.
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
  bands. `global-error` and `global-not-found` replace the root layout, so they bring
  the fonts and the theme themselves. The 404 declares no canonical URL.
- **The footer is a metadata block**: commit, browser, the local time, the window, the
  build date and the source repository, then links. The live readings use
  `useSyncExternalStore` with a pending server snapshot; the clock ticks on the second.
  Its bands rise to their own column: `RisingBand` reads where the masonry's first or
  last lane ends and stays hidden until it has, so on a page without the work they
  never show.
- **The home page carries JSON-LD**: a `Person` at `https://lenysauzet.com/#person`,
  every spelling of the name, `sameAs` each profile and the blog, inside a
  `ProfilePage`. The blog should point its author at that `@id`.
- **Live cursors** are in `.claude/rules/presence.md`, which loads with their files.
- **The page's foot is blurred progressively.** `PageBlur` stacks backdrop blurs whose
  radii add in quadrature to an exponential curve (`lib/blur.ts`), 12px at the edge,
  layers under 1px dropped. Over the last 96px of scroll it is squeezed to the edge
  (`scaleY`, no layout) and hidden at zero, so the footer's last links are clear; it
  starts hidden until measured and hides under `prefers-reduced-transparency`.
  `scroll-padding-bottom` keeps a focused element out from under it.
- **The footer belongs to the home page**; the status pages render their own `<main>`
  and none, its bands rising from the project columns.
- **`/resume` proxies the PDF** so `download` holds across origins; the edge caches it
  a day and a failure is never cached. A PDF replaced on the CDN under the same name
  needs a Cloudflare purge.
- **Images are unoptimized under `next dev`**: on a NAT64 network the CDN resolves to
  `64:ff9b::`, which the optimizer refuses as a private IP. Never set
  `dangerouslyAllowLocalIP`; to look at a local production build, serve the original
  through a Playwright route.

## Branches

One change per branch, PR into `main`, squash-merge. Never commit straight to `main`.
