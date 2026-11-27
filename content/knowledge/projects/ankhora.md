---
slug: ankhora
title: Ankhora
year: '2026'
status: in-progress
role: lead
stack: [Unity 6, C#, URP, Meta XR SDK, OpenXR, Meta Quest 3, GitHub Actions, Claude Code, CodeRabbit]
repo: https://github.com/LenySauzet/Ankhora
summary: >-
  A Meta Quest platform for spatial masterclasses: an expert's voice and hand gestures are
  captured once, around the object itself, and replayed in 3D for every new employee who needs
  to learn the skill.
---

## Context

Every company holds know-how that lives in a few experts' hands: how to run a machine, how to make a precise gesture, how to repair something. Passing it on means taking an expert away from their work to repeat the same demonstration for every new hire, and a video or a manual never quite shows how it is really done.

Ankhora puts XR at the service of that problem. An expert records a masterclass once, in their own space: their voice, their hands, what they point at, around the object itself. Every new employee then replays it in an immersive environment, as many times as they need, at their own pace. It is the tutorial of tomorrow, and no general-purpose tool does it today.

It began as a team project at Epitech, to discover the XR specialisation, and I led it. I am convinced it can genuinely help industry, in a field that is still far too little explored, which is why it keeps going beyond the school brief.

## What I built

The heart of the product runs on a Meta Quest 3: an instructor records a chapter, their voice and ghost hands are captured together in one take, and a learner replays them in sync, in 3D.

Around it, the project is built to grow rather than to demo once:

- **A product model designed to last**: masterclasses made of chapters, with voice, hands and pinned media laid out on a timeline, saved in a format that a future platform will sync as is.
- **An architecture written down**: recorded decisions, a feature-based structure, and the core logic kept testable outside the engine.
- **A spatial interface** with its own design system, in the spirit of visionOS and Meta's spatial guidelines.
- **AI across the whole development workflow**: custom skills for each XR domain, specialised agents that work as a team on a feature, automatic code review on every pull request, and progress reports with analytics generated for each review with the school.

The vision goes further: masterclasses aligned with the real machines in a scanned room or anchored on the object itself, a web platform for companies and a marketplace of skills, analytics for instructors, and an AI assistant learners can question.

## Hard parts

Capturing the joints of both hands every frame and replaying them as ghost hands, in sync with spatialised voice. It was the riskiest piece of the project, so it was built first. It was also my first XR application and my first project in Unity, learned while building it.
