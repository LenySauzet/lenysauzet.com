---
paths:
  - 'lib/presence/**'
  - 'app/_components/Home/Presence/**'
  - 'workers/presence/**'
  - 'components/shared/SelectionFrame.tsx'
---

# Live cursors

The other visitors' cursors, selections, frame pulls and clicks on the home page,
anonymous, relayed by one Durable Object room.

## Who sees whom

- **Where it runs** is `lib/presence/availability.ts`: a fine pointer, popover support,
  a URL (`siteConfig.presenceUrl`, production's on Vercel production only,
  `NEXT_PUBLIC_PRESENCE_URL` anywhere), and for production's URL the site's own origin,
  which the room alone accepts. "Live cursors" in the palette shows On or Off and closes
  the socket when off.
- **Only visitors on the same layout are shown** (`layout.ts`: the columns the projects
  take, 1 below 48rem, 2 below 64rem, 3 above). Between layouts no mapping keeps both
  the motion and what is pointed at. Paths and selections carry their owner's layout,
  and `room-state.ts` regroups when either side crosses a breakpoint.
- **A modal hides everyone and stops sharing** (`overlays.ts`): Radix's
  `data-scroll-locked` on `body`, or a `cal-modal-box` unless `state="closed"` or hidden
  inline, as its close button leaves it `loaded`.

## The room

- **Hibernating WebSockets**: everything that must survive lives in the socket's
  attachment (id, activity, last path, selection, departed), and the heartbeat is an
  auto-response. 24 seats, the idlest let go with 4000 when full; 4 per address, IPv6
  counted by its /64, the address hashed into a socket tag. Only open sockets count:
  a closing one held a seat and was evicted in place of the idlest.
- **The budget is spent before anything is read**: a burst of 120 at 75 a second;
  over 512 characters or unreadable is dropped. Refusals run up a debt that drains at
  the same pace, and past 150 the socket is closed with 4001. A client stays down after
  4000 or 4001 until its pointer moves.
- **A departure is announced once** (`departed`), then the close handshake runs:
  `webSocketClose` still calls `close()`, as local sockets otherwise stayed CLOSING. The
  last path is written at most every 250 ms, so a snapshot may lag by that much.
- **The wire is `protocol.ts`**, pure, imported by the worker: one tag per type, one
  body codec both ways, decoders that check arity, ranges and names. Its tests keep the
  worst cases (four samples on the longest anchor, eight spans) within the limit.

## Placement

- **Anchors are leaves** (`data-presence`), never nested. A sample is the fraction of
  its anchor's box at the closest point on the edge, plus the pixels beyond. The anchor
  is the one under the pointer, else the one last left while within 600px (beyond, a
  margin parked through a long scroll drifts past the 4000px a sample may carry), else
  the nearest.
- **The latest sample may carry a detail**: the character under the pointer (`#index`,
  kept only when that character's box holds the pointer) or the deepest element (child
  indices), with its size. The receiver adds its offset weighted by how slowly the path
  moves (none from 0.45 px/ms, full at rest, over 110 ms), and only where that element
  is the same size within 40%: "You" in "Book a call" exists only where it is hovered
  open. Text that differs between visitors (`data-presence-volatile`) is not counted.

## Timing

- **Moves are batched**: sampled on every move, sent every 33 ms as up to four samples
  with their age; a press, release, click or drop flushes first. Scrolling, the own
  cursor leaves and comes back where it settles, 160 ms later.
- **Everything plays on one timeline**: samples at arrival minus age, behind a
  `Cadence` delay (interval plus 2.5 times its jitter, 40 to 160 ms) learned only from
  batches that continue a motion. Presses, clicks, leaves and frame pulls are signals on
  it, so they meet the cursor in order; a removed visitor's pending pulls and drops play
  at once.

## Drawing

- **Two `popover="manual"` layers**, in the top layer above the island, palette and
  cal.com, stacked in the order they are shown: ripples, then cursors, so a ripple never
  bends a cursor. The ripples' layer is never faded with the cursors'. Fixed to the
  viewport, cursors trail a composited scroll by a frame: the price of the top layer.
- **One rAF loop outside React** (`remote-cursors.ts`) reads every box, then writes,
  and sleeps at rest or under a modal. `lib/presence/pose.ts` is the motion: the damped
  path, a tilt across the arrow's axis (34° at most), directional blur, four ghosts over
  56 ms, a spring on press, a trace after 1 s still. Ten cursors at most. Reduced motion
  keeps the path only.
- **Selections are marks per anchor**, swept in characters (`selection.ts` plans which
  carry, fold or begin; only one keeping an end sweeps from the last), from the right
  when made backward. Backgrounds are boxes from the range's text nodes, joined only
  where they touch, in a `z-30` layer on `body`; the text takes the author's ink through
  `::highlight()`. `DOMRect` fields are getters: copy them by name.

## Clicks

- **The owner decides** (`clicks.ts`: under 8px of movement, no selection left, not
  the second of a double click) and sends `click`. Receivers ripple at the press, one per
  150 ms per visitor, three at once. Nothing on what moves with its content
  (`data-presence-ignore`, the island).
- **The ripple is a `backdrop-filter`**: a ring displacement map over a neutral grey
  flood (an `feImage` leaves the rest of its region transparent black), applied at three
  strengths for the colour channels and screened together. WebKit accepts the filter and
  draws nothing, so it is skipped there (`GestureEvent`).

## Frames

- **`SelectionFrame` corners move two edges** on a 40px rubber band; the hatching lies
  over the page's background clipped to the edges, and the content is clipped while off
  rest. Pulls go through `frames.ts`. A frame follows another visitor's pull unless held
  here, returns to it when let go here, and is let go on a drop, a departure, a lost
  socket or the room closing.
