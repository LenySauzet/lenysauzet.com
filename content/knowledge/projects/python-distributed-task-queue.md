---
slug: python-distributed-task-queue
title: Distributed Task Queue
year: '2026'
status: shipped
role: solo
stack: [Python, Celery, RabbitMQ, Redis, Django, OpenAI API, Pydantic, Docker]
repo: https://github.com/LenySauzet/python-distributed-task-queue
summary: >-
  A set of hands-on experiments with distributed task queues in Python, from a minimal Celery
  worker to scheduled jobs, background LLM calls and a Django integration.
---

## Context

Background jobs are what keep an application responsive once the real work gets slow: calling a model, processing a file, syncing data every night. I wanted to understand how professional task queues are built, one pattern at a time.

## What I built

Five self-contained examples, each with its own Docker Compose setup, using RabbitMQ as the broker and Redis for results:

- **A minimal worker**, to see the core of distribution and result tracking.
- **LLM calls offloaded to workers**, extracting structured data with a model and validating it with Pydantic, then a multi-step version of the same idea.
- **Scheduled tasks** with Celery Beat, on cron-style and interval schedules.
- **A Django application** that submits tasks and follows their status from the web.
