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
  A card may wait for its story: `bun run knowledge` lists the untold ones, and a new
  card never blocks a deploy.
- **A year is when the project began**, never its last update: the assistant repeats it,
  and "my first project at Epitech" must not read as 2026.
- **A story uses the fixed sections** (`STORY_SECTIONS`), in their order, once each,
  `REQUIRED_SECTIONS` always present, so later retrieval cuts it where a reader would.
  A section with nothing true to say is left out, never filled.
- **The core stays under `CORE_TOKEN_BUDGET`**: the profile, each summary, the FAQ and
  each post's title and description, which will sit in every prompt. Stories and post
  bodies are read on demand and do not count.

## What the code does not say

- **What must not be said is never written here**: salary, private life, health,
  family, address, administrative status beyond the work authorisation the profile
  states, opinions on former employers or colleagues, anything Tolk.ai keeps internal
  (clients, colleagues, prompts, internal service names, thresholds). A fact absent from
  the corpus cannot leak through any prompt. The Tolk.ai figures and vendors in the
  profile are public: Tolk.ai published them itself.
- **What Lény shared for context stays out**: how a past job felt, why he left, what he
  missed there. The corpus turns it into preferences, never into a story.
- **Every key Lény writes is strict**: a misspelt field fails rather than vanishing. A
  post's frontmatter belongs to the blog, so `postSchema` reads what it needs and lets
  the blog add fields.
- **Recommendations are quoted verbatim in their language**, with their authors'
  consent; the model may translate them when answering, never rewrite the original.
- **A blog that does not answer warns, never fails**: the posts that answered are kept,
  and links to posts are only checked when the whole blog was read. A feed with no post,
  or with an item that is not a post, is not a whole blog.
- **YAML years are quoted** (`start: '2023'`): a bare `2023` is a number.
