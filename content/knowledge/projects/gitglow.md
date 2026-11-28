---
slug: gitglow
title: GitGlow
year: '2024'
status: shipped
role: solo
stack: [Next.js, React, TypeScript, Tailwind, shadcn/ui, Zustand, Motion, dnd-kit, Google Fonts API]
repo: https://github.com/LenySauzet/gitglow
app: https://gitglow.lenysauzet.com
summary: >-
  An open-source editor that turns a project into a polished cover in seconds: pick a template,
  set the theme, fonts and stack, and export a cover ready for a README.
---

## Context

A repository is often judged in the first second, by the image at the top of its README. Most projects have none, because making a good one means opening a design tool for something that should take a minute.

I wanted every one of my projects to make a strong first impression, quickly and consistently. GitGlow is the tool I built for that, and open-sourced for anyone who cares about how their work is presented.

## What I built

A browser-based cover editor with a live preview:

- **Templates by category**, each exposing its own typed fields: text, colours, icons, images, selects.
- **Theming**: any accent colour drives the template, with light and dark renderings of the cover.
- **Custom fonts** from the whole Google Fonts catalogue, embedded into the exported file so the cover looks the same everywhere.
- **The project's stack** as icons, reordered by drag and drop.
- **Export** to PNG, JPEG or SVG with one key, and a preview that tilts in 3D under the cursor.

Under the hood, a template is a component plus a schema of fields, so adding one never touches the editor itself, and all editor state lives in one store.
