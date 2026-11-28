---
slug: travel-order-resolver
title: Travel Order Resolver
year: '2026'
status: shipped
role: lead
stack: [Python, spaCy, Faster-Whisper, FastAPI, Streamlit, SQLAlchemy, TheFuzz, dateparser, Navitia API, Docker, uv, Jupyter, pytest]
repo: https://github.com/LenySauzet/travel-order-resolver
summary: >-
  A train journey planner you simply talk to, in French: it understands where you are going
  and when, from text or voice, and finds the itinerary through the SNCF's Navitia API.
---

## Context

My first natural language project at Epitech. The brief: take a travel request written the way people actually speak, in French, and turn it into a train journey. I approached it as a small clone of the smart search in SNCF Connect, and learned a lot along the way.

I led the project and built most of it, then a classmate and I finished the last features together for the final delivery.

## What I built

A pipeline from a sentence, or a voice note, to an itinerary:

- **Transcription** of spoken requests with Faster-Whisper.
- **A custom named-entity model** trained with spaCy to find the departure, the destination and the time in a sentence, with notebooks for data preparation, training and evaluation.
- **Fuzzy matching** of station names, so typos and variants still land on the right station, and the nearest station found from the user's location when no departure is given.
- **Time normalisation** for French expressions: "15h30", "demain matin", "ce soir", "lundi prochain".
- **Journey search** through the Navitia API, shown in a chat interface with the route on a map.

The back end is a FastAPI service, the front end a Streamlit app, and the whole thing runs with Docker.

## Hard parts

French travel requests are messy: the same city named three ways, times as vague as "le matin", and a departure that is often implied. Each layer of the pipeline exists to absorb one of those ambiguities before the next one runs.
