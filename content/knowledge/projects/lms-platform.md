---
slug: lms-platform
title: LMS Platform
year: '2026'
status: shipped
role: solo
stack: [Next.js, React, TypeScript, Prisma, MySQL, Clerk, Stripe, Mux, shadcn/ui, React Hook Form, Zod]
repo: https://github.com/LenySauzet/lms-platform
app: https://lms-platform-khaki-pi.vercel.app
summary: >-
  A complete learning platform: teachers create courses with video chapters, students buy them,
  watch them and track their progress.
---

## Context

A learning management system touches most of what a real product needs at once: accounts, payments, media, content editing and progress. I rebuilt one end to end by following Code With Antonio's course, to work through all of it in a single application.

## What I built

- **A course marketplace** to browse and filter courses.
- **Teacher mode** to create courses and chapters, with a rich text editor.
- **Video** uploaded, processed and streamed through Mux.
- **Payments** with Stripe, and authentication with Clerk.
- **Progress tracking** chapter by chapter.

The data lives in MySQL through Prisma.
