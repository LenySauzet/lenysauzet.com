# CLAUDE.md

The portfolio at lenysauzet.com: one page, an island, a command palette and the work.
Its sibling is the blog (`../blog.lenysauzet.com`), whose components this one adapts
rather than imports. `AGENTS.md` points here.

## Commands

```bash
bun dev
bun run build
bun lint
bun run type-check
bun run test          # Vitest; `bun test` is Bun's own runner and will not work
```

## Verification gate

`bun lint && bun run type-check && bun run test && bun run build`, exactly what
`.github/workflows/ci.yml` runs. Then look at both themes, at phone and desktop widths.

## Writing style

English, single quotes, no em dash. **No comments in the code**: names, types and
structure carry the meaning, and every trap is written down here instead. Never run
`prettier` on a directory, only `--single-quote` on exact paths.

## Architecture

Next.js 16 App Router, statically generated. Tailwind v4 and shadcn/ui (`radix-vega`,
Hugeicons), tokens only, the blog's palette on `--base-hue` fixed to its default blue.
`next-themes` puts `light` or `dark` on `<html>`, dark by default as on the blog.

| Path | What it owns |
|---|---|
| `config/site.ts` | Identity, links, the cal.com handle, the resume, root metadata |
| `content/projects.ts`, `content/clients.ts` | What the page shows, typed, by hand |
| `lib/masonry.ts` | Tiles into columns, shortest column first |
| `lib/media/probe.ts` | An image's size and a 16px blur placeholder, read with sharp at build time |
| `lib/commands/` | The palette's registry, its groups and its shortcuts |
| `lib/services/booking.ts` | cal.com's modal, loaded on first use |
| `app/_components/Island` | The island: identity, hint, announcements |
| `app/_components/CommandPalette` | The launcher, always mounted, and the palette, loaded on intent |
| `app/_components/Home` | The hero, the "+ You" button, the client logos, the project grid |

## What the code does not say

- **The palette loads on intent.** `PaletteLauncher` holds the keyboard (⌘K and every
  shortcut) and mounts the palette through `next/dynamic` once it is `wanted`: pointing
  at or focusing the island, or the first ⌘K. A visitor who never opens it never
  downloads cmdk or the dialog. The shortcuts match the blog's, so habits carry over.
- **A command runs once the palette has closed**, in `onCloseAutoFocus`: cal.com's modal
  opened over a closing dialog fights it for focus. Radix hands focus back to a trigger
  and the palette has none, so it notes what held focus on opening and returns it,
  under `returningFocus`, which keeps the island from reading that as pointing.
- **The masonry is decided at build time.** Each image is probed at build time, the
  tiles are spread one, two and three columns wide, and CSS shows the layout for the
  width, so nothing moves on load. Each tile goes to the shortest column, so tiles appear
  newest first by their top edge, but the DOM, and so Tab and a screen reader, runs
  column by column: masonry without it is CSS `grid-lanes`, to adopt once every engine
  ships it. Hidden copies are `display: none`, out of the accessibility tree, and their
  lazy images are never fetched. A missing image warns and falls back to 16:9.
- **The island speaks through a live region.** Its pill is `aria-hidden`, so an
  announcement also lands in an `sr-only` `role="status"`; a refused clipboard still
  answers, the island showing the text itself.
- **The CTA pills share `pillSurface`** (`ui/pill.ts`): `rounded-xl`, never full, so they
  do not echo the island; `glass-rim` for the top-lit border, `--shadow-pill` per theme,
  no background change on hover. Three sit on a `1fr auto 1fr` grid, Email centred, so
  "Book a call" grows leftwards and the other two never move. Its "+ You" is not
  clipped and not delayed: it scales from 0 at its left edge on the same curve and
  duration as the space opening, so it fills the gap as it grows. A clip showed the
  blur's hard edge and cut the circle; a delay read as a pause. The three labels share
  `--foreground`, which `shine-text` paints under its band.
- **Animated icons are Hugeicons Animated** (community, MIT), installed with
  `bunx --bun shadcn@latest add @hugeicons-animated/<name>` into `components/ui/`,
  comments stripped, with `lib/use-icon-animation.ts`. An icon plays when its whole
  control is hovered or focused, through `useAnimatedIcon`, never by moving the icon.
- **The theme changes under the blog's sweep**: `withThemeTransition` wraps the change in
  a view transition, and the new theme grows from the top left as a blurred circle.
- **Entrances are the 404's**: `rise` (blur, opacity, half a rem) staggered by
  `--rise-step` in the hero, `Reveal` on each card as it enters the view. `Reveal`
  animates blur and opacity only: Motion runs those on the compositor, while a
  translate ran on the main thread and stuttered through hydration as a jump. Reduced motion
  shows everything at once.
- **Client logos are shadcn `Avatar`s** in an `AvatarGroup`, at `portfolio/clients/` on
  the CDN; until a logo is there the fallback initial shows. Hovered or focused, one
  scales up over its neighbours, its name in a tooltip below.
- **A project is a still, and maybe a video**: `image` is always probed (the masonry
  needs its ratio, the blur-up its placeholder) and stays under the video, which plays
  muted only while a quarter of it is in view, never under reduced motion. Each medium
  arrives out of blur over the placeholder once it has loaded or started playing, so a
  cached image and a lazy one below the fold behave alike; next/image replays a load
  or error that happened before hydration. A failed image leaves hatching and an icon.
  A project has at most one action: an article, an app or its code. Title and year sit on the
  media over a blurred scrim, `--media-ink` on `scrim` in both themes.
- **The shine is CSS alone**: a registered `--sweep` animated in `@keyframes`, painted
  through `shine-text` (background-clipped over `--foreground`) and `shine-border` (a
  masked ring). The text's band dims in dark and lightens in light, `--shine-text`,
  since a white glint on near-white text is invisible; the rim's is `--shine-rim`.
  Reduced motion parks the band off the box.
- **`ui/command.tsx` is the blog's**, not the CLI's: glass panel, Motion dialog that
  travels its backdrop blur, a bare 16px input below `sm` (iOS zooms under it), rows
  selected only under a fine pointer or the keyboard (`data-keyed`), a leaving dialog
  `inert`. `FadingList` fades the list's ends. A picked command runs on
  `onExitComplete`, so cal.com never opens over a closing dialog. Shortcuts hide on
  coarse pointers and read Ctrl+ off Apple systems.
- **The palette's input is named `search`**: password managers (iCloud Passwords
  among them) offer themselves on a text field despite `autocomplete="off"`, and cmdk
  forces `type="text"`. Unverified against the extension itself.
- **A resume download is announced** in the island, from the pill or the palette,
  through `announceResume` in `lib/services/resume.ts`.
- **The 404 is the blog's `StatusPage`**: the status as a hairline outline of Departure
  Mono (stroked at twice its width, then covered by the same text in `--background`, so
  only the outer half shows), the serif title, the copy, faded hatched bands, all on
  `rise`. Tooltips are the blog's too: `--card` with a border, no arrow.
- **The footer is Maxime Heckel's metadata block in our type**: commit (Vercel's SHA,
  else git), browser, Montpellier's time, the window, last update, then links. The live
  readings are `useSyncExternalStore` with a `null` server snapshot, so the static HTML
  shows a dash and nothing mismatches on hydration.
- **The footer's bands rise to their own column**: `RisingBand` measures where the
  masonry's first or last lane ends (`data-lane`, lanes `self-start` so each is only
  as tall as its cards) and reaches up to 2rem below it, fading in over 8rem. They
  wait hidden until measured, so they appear once, already in place.
- **The home page carries JSON-LD** (`lib/seo/structured-data.ts`): a `Person` at
  `https://lenysauzet.com/#person`, every spelling of the name, `sameAs` to each
  profile and the blog, inside a `ProfilePage`. The blog should point at that `@id`.
- **Below `sm`, "Book a call" is shown grown and spans the row**, Email and Resume
  halving the one beneath: a phone has no hover to reveal "+ You".
- **`/resume` proxies the PDF** so `download` holds across origins, cached at the edge
  by `s-maxage`.
- **Images are unoptimized under `next dev`**: on a NAT64 network the CDN resolves to
  `64:ff9b::`, which the optimizer refuses as a private IP, so dev serves the originals
  and production optimizes. Never set `dangerouslyAllowLocalIP`; to look at a local
  production build, serve the original through a Playwright route.

## Branches

One change per branch, PR into `main`, squash-merge. Never commit straight to `main`.
