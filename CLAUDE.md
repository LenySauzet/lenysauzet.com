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
| `lib/media/measure.ts` | An image's size from its header, at build time |
| `lib/commands/` | The palette's registry, its groups and its shortcuts |
| `lib/services/booking.ts` | cal.com's modal, loaded on first use |
| `app/_components/Island` | The island: identity, hint, availability, announcements |
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
- **The masonry is decided at build time.** Each image is measured from its header, the
  tiles are spread one, two and three columns wide, and CSS shows the layout for the
  width, so nothing moves on load. Each tile goes to the shortest column, so tiles appear
  newest first by their top edge, but the DOM, and so Tab and a screen reader, runs
  column by column: masonry without it is CSS `grid-lanes`, to adopt once every engine
  ships it. Hidden copies are `display: none`, out of the accessibility tree, and their
  lazy images are never fetched. A missing image warns and falls back to 16:9.
- **Pointing at a way to reach me shows the availability** on the island (`showsAvailability`
  on the button and the "+" bubble), and it leaves with the pointer or the focus.
- **The island speaks through a live region.** Its pill is `aria-hidden`, so an
  announcement also lands in an `sr-only` `role="status"`; a refused clipboard still
  answers, the island showing the text itself.
- **The "+ You" button grows leftwards.** The CTA row is two equal columns from `sm`,
  the button pinned to the centre gap, so its growth never moves "Explore my work"; a
  touch screen has no hover and shows it grown.
- **The shine is CSS alone**: a registered `--sweep` animated in `@keyframes`, painted
  through `shine-text` (background-clipped over `--foreground`) and `shine-border` (a
  masked ring). The text's band dims in dark and lightens in light, `--shine-text`,
  since a white glint on near-white text is invisible; the rim's is `--shine-rim`.
  Reduced motion parks the band off the box.
- **`ui/command.tsx` is customised**, so update it with `add command --diff`:
  - the stock `CommandItem` tick is gone: it took `ml-auto` and pushed a row's hint to
    the middle;
  - the sr-only title sits inside `DialogContent`, or it renders in the page as an h2
    before the h1;
  - `CommandInput` is a bare input, 16px below `sm`, where iOS zooms on focus, without
    `InputGroup`;
  - the selection shows only under `any-pointer-fine`: cmdk always selects a row, which
    under a finger reads as a row stuck lit. Shortcuts hide on coarse pointers and read
    Ctrl+ off Apple systems;
  - `CommandDialog` forwards `onOpenAutoFocus` and `onCloseAutoFocus`;
  - every `ui/` file imports `cn` from `@/lib/utils` (the CLI wrote `from "cn"`).
- **`/resume` proxies the PDF** so `download` holds across origins, cached at the edge
  by `s-maxage`.
- **Locally, `next/image` may refuse the blog's images** with "resolved to private IP":
  a NAT64 network answers `64:ff9b::` addresses. It works in production. Never set
  `dangerouslyAllowLocalIP`; serve the original in a Playwright route to look at it.

## Branches

One change per branch, PR into `main`, squash-merge. Never commit straight to `main`.
