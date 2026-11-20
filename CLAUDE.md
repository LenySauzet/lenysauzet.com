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
  width. `columns` would read and tab column by column; nothing moves on load; hidden
  copies are `display: none`, out of the accessibility tree, and their lazy images are
  never fetched. A missing image warns and falls back to 16:9 rather than failing.
- **Pointing at a way to reach me shows the availability** on the island (`showsAvailability`
  on the button and the "+" bubble), and it leaves with the pointer or the focus.
- **A refused clipboard still answers**: the island shows the text itself.
- **The shine is CSS alone**: a registered `--sweep` animated in `@keyframes`, painted
  through `shine-text` (background-clipped, over `--shine-ink`) and `shine-border` (a
  masked ring). Reduced motion stops it and blanks the band.
- **The stock `CommandItem` tick is gone**: it took `ml-auto` and pushed a row's hint to
  the middle. `CommandDialog` forwards `onOpenAutoFocus` and `onCloseAutoFocus`, and every
  `ui/` file imports `cn` from `@/lib/utils` (the CLI wrote `from "cn"`).
- **Locally, `next/image` may refuse the blog's images** with "resolved to private IP":
  a NAT64 network answers `64:ff9b::` addresses. It works in production. Never set
  `dangerouslyAllowLocalIP`; serve the original in a Playwright route to look at it.

## Branches

One change per branch, PR into `main`, squash-merge. Never commit straight to `main`.
