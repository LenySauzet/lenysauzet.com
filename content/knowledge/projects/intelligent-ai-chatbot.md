---
slug: intelligent-ai-chatbot
title: Intelligent AI Chatbot
year: '2025'
status: shipped
role: solo
stack: [Python, TensorFlow, Keras, NLTK, NumPy]
repo: https://github.com/LenySauzet/intelligent-ai-chatbot
summary: >-
  A chatbot built from scratch with a neural network: it classifies what the user means and
  answers from intents it was trained on.
---

## Context

Before language models made chatbots a commodity, a chatbot meant understanding intent. I built one from the ground up to learn how that works.

## What I built

A pipeline that tokenises and lemmatises sentences with NLTK, trains a neural network with Keras to classify them into intents, and picks an answer from the most probable one. The intents live in a single file, so the bot can be taught new topics by editing it and retraining.
