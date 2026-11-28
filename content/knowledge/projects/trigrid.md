---
slug: trigrid
title: TriGrid
year: '2023'
status: shipped
role: solo
stack: [JavaScript, HTML, Canvas]
repo: https://github.com/LenySauzet/TriGrid
summary: >-
  A small web tool that turns a contrasted image into a knitting grid and its stitch chart.
---

## Context

Knitting a picture into a garment starts with a grid: one cell per stitch, each one coloured or not. Drawing that grid by hand from an image is slow and error prone, so I wrote a tool to do it.

## What I built

The image is resized to the number of stitches wanted, sampled cell by cell on a canvas, and each cell becomes a coloured or a blank stitch depending on a contrast threshold, drawn as a grid ready to follow.
