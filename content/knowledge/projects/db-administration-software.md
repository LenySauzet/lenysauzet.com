---
slug: db-administration-software
title: DB Administration Software
year: '2023'
status: shipped
role: solo
stack: [C#, .NET, Windows Forms, MySQL, SQL]
repo: https://github.com/LenySauzet/DB-Administration-Software
summary: >-
  A desktop application for administering a database, with role-based access, full input
  validation, advanced search and PDF summaries, in C#.
---

## Context

It began as a school project in VB.NET. I rewrote it in C# and pushed it further, aiming for software that adapts to the database it connects to, with the care of a professional tool.

## What I built

- **Navigation and design** meant to be clear and professional, with menus and a customisable look.
- **Adding, editing, deleting and viewing data** according to the rights of the signed-in user.
- **Complete input validation**, and **advanced search** across a table or the whole database.
- **PDF summaries** generated automatically for each table.
- **A clean data layer**: stored procedures and triggers on the database side, and a class library for every exchange with it.
