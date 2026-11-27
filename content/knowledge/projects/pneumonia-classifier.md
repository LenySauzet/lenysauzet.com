---
slug: pneumonia-classifier
title: Pneumonia Classifier
year: '2025'
status: shipped
role: solo
stack: [Python, PyTorch, ResNet18, Streamlit, Pillow, Matplotlib, NumPy]
repo: https://github.com/LenySauzet/pneumonia-classifier
summary: >-
  A deep learning model that detects pneumonia on chest X-rays, in an application that shows its
  confidence and a clear medical disclaimer.
---

## Context

Medical imaging is one of the places where computer vision is most useful, and where its limits matter most. I wanted to build a classifier for chest X-rays, and the interface around it, with that responsibility in mind.

## What I built

A ResNet18 model trained with PyTorch to tell normal X-rays from pneumonia, and a Streamlit application where an image is uploaded or picked from examples, analysed in a moment on a CPU or a GPU, and shown with the model's probabilities. The application states plainly that it is an educational tool, not a diagnosis.
