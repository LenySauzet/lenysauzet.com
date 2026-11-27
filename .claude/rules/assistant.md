---
paths:
  - 'content/knowledge/**'
  - 'content/projects.ts'
  - 'lib/assistant/**'
  - 'scripts/knowledge.ts'
---

# The assistant's knowledge

What the assistant knows about Lény, written by hand and read as a typed corpus. The
model is not wired yet; this is the only place it will learn from.

## Shape

- **`content/knowledge/` is the source**, in English whatever the visitor's language:
  `profile.yaml` for the facts, `projects/<slug>.md` for one story per card,
  `faq/<id>.md` for answers Lény words himself. The blog is read from its feed and each
  post's Markdown twin (`/posts/<slug>/index.md`), never copied here.
- **Every story has a card.** A story's slug is its file name and an entry of
  `content/projects.ts`, whose `slug` also names the card's folder on the CDN; its title
  and year match the card's, and a card that links an article lists it in `blogPosts`.
  A card may wait for its story: `bun run knowledge` lists the untold ones.
- **A story uses the fixed sections** (`PROJECT_SECTIONS`), so later retrieval cuts it
  where a reader would.
- **The core stays under `CORE_TOKEN_BUDGET`**: the profile, each summary, the FAQ and
  each post's title and description, which will sit in every prompt. Stories and post
  bodies are read on demand and do not count.

## What the code does not say

- **What must not be said is never written here**: salary, private life, health,
  family, address, administrative status, opinions on former employers or colleagues,
  anything Tolk.ai keeps internal (clients, colleagues, prompts, service names,
  thresholds). A fact absent from the corpus cannot leak through any prompt.
- **Every key is strict**: a misspelt field fails rather than vanishing.
- **Recommendations are quoted verbatim in their language**, with their authors'
  consent; the model may translate them when answering, never rewrite the original.
- **A blog that does not answer warns, never fails**: the posts that answered are kept,
  and links to posts are only checked when the whole blog was read.
- **YAML years are quoted** (`start: '2023'`): a bare `2023` is a number.
