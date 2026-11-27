---
slug: blog
title: The Blog
year: '2026'
status: shipped
role: solo
stack: [Next.js, React, TypeScript, MDX, Tailwind, shadcn/ui, Motion, WebGL 2, Recharts, Sandpack, Vitest, Cloudflare R2, Vercel]
app: https://blog.lenysauzet.com
summary: >-
  My blog: deep dives on the web, shaders, real-time 3D and software engineering, where hard
  topics become something you can play with, through interactive figures, live code and
  detailed walkthroughs.
---

## Context

I write the articles I wished I had when I was learning: on the web, shaders, real-time 3D, creative coding and software engineering. Each one goes deep into a single topic, and tries to give the reader not only the answer but the intuition to explore further on their own.

A wall of text rarely builds that intuition. So the blog is designed around interaction: when an idea is easier to understand by moving it, the article lets the reader move it.

## What I built

A statically generated site on Next.js where every post is MDX, and every visual is a real component rather than a picture:

- **Figures built from one toolbox**: drawn diagrams and constructions over pure, tested geometry, charts on Recharts, and a single WebGL 2 engine for shaders over images, video and time, all sharing one visual language.
- **Live code**: editable, runnable examples themed with the site's own tokens.
- **A reading experience**: a reading rail that follows the article's headings, a command palette, link previews, and a Dynamic Island that carries navigation and context.
- **A design system**: one hue drives every colour, the reader chooses an accent, both themes are designed rather than inverted, and a public design-system page renders every content component.
- **A Markdown twin of every post**, served next to it, so agents and assistants can read the articles as cleanly as people do.

The media lives on my own CDN on Cloudflare R2, and the repository carries its own agent setup: rules by folder, skills by task, and an eval that checks the agent loads the right skill.

## Hard parts

Making figures that stay correct at every value of their controls, in both themes, at phone and desktop widths, and with reduced motion. Every figure goes through the same proof: pure tests swept across its controls, tests proved by breaking the code they guard, then an inspection in a real browser.
