---
slug: q-learning-taxi-v3
title: Taxi v3 Q-Learning
year: '2026'
status: shipped
role: solo
stack: [Python, Gymnasium, NumPy, Jupyter]
repo: https://github.com/LenySauzet/q-learning-taxi-v3
summary: >-
  A reinforcement learning agent that teaches itself to drive a taxi in a grid world: pick up a
  passenger, drop them at the right place, in as few moves as possible.
---

## Context

Taxi is a classic reinforcement learning environment: a 5 by 5 grid, a passenger to pick up, a destination to reach, and penalties for wasted or illegal moves. It is small enough to see every part of the learning, which made it the right place to build Q-learning from the ground up.

## What I built

A Q-learning agent written by hand in a notebook: a table of 500 states by 6 actions updated with the Bellman equation, and an epsilon-greedy strategy whose exploration decays over 10,000 training episodes. Once trained, the agent takes the shortest path to the passenger and the destination without a wrong move.
