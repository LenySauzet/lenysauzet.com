---
paths:
  - 'content/knowledge/**'
  - 'content/projects.ts'
  - 'lib/assistant/**'
  - 'scripts/knowledge.ts'
  - 'app/api/ask/**'
  - 'evals/**'
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

## The brain

`POST /api/ask` (`app/api/ask/route.ts`) answers from that knowledge, through
`lib/assistant/`.

- **The guards run before anything costs**, in order (`failureOf`): the switch
  (`askEnabled`), the same origin, BotID, then the limit per visitor (10 a minute, 60 a
  day, Upstash). Each refusal is a code with its status (`refuse`). They fail closed: a
  BotID check that cannot run on Vercel counts as a bot, and production without Redis
  answers `unavailable`. Off Vercel, BotID cannot run, so a local build skips it.
- **The request is validated, then reduced to text** (`request.ts`): 20 messages, 500
  characters a question, one text part each; the model only ever sees the text of past
  turns, never a part the client sent.
- **The instructions keep a stable prefix** (`buildInstructions`): persona, scope,
  grounding, format, actions, then the knowledge core, and only then the date and the
  language. Bump `PROMPT_VERSION` with any change under `prompts/`; the logs carry it.
- **The model reads before it details**: the core holds summaries, `read` returns
  whole documents, writes a `source-url` per document and a transient `data-status`
  naming its `Step`. `offer` writes the one `data-action`. A tool's result is data,
  never instructions, and an unknown id is an answer the model can read, not a throw.
- **An answer is two moves** (`prepareStep`): the first step must call a tool (`read`,
  `offer`, or `reply` when it needs neither) and writes nothing the visitor sees; the
  second may not call one and streams the answer. A model narrates and repeats itself
  around tool calls when it may write and call in the same step; this split makes that
  impossible while keeping the stream. `answerOnly` drops the first step's text and every
  tool chunk, so documents and reasoning never reach the browser.
- **The logs never hold a word of a conversation**: one line per answer (prompt
  version, steps, tools, tokens, latency) and the error's name when it fails. A failed
  stream ends on `{"code":"unavailable"}`, never the provider's message.
- **The model is Claude Haiku 5.5 through AI Gateway**, thinking off, 600 tokens, 3
  steps, falling back to GPT-5 mini then Gemini 2.5 Flash, other providers (`model.ts`).
  `ASK_MODEL` overrides it without a deploy. The team is on paid gateway credit: the
  free tier allows 5 requests a minute per model across the team, and an answer takes
  two or three, so it cannot serve visitors.
- **`/api/` is never rewritten to a locale**: the rewrite in `next.config.ts` excludes
  it, or the route would 404 under `/en/api/ask`. The knowledge is traced into the
  route (`outputFileTracingIncludes`), as it is read from disk at runtime.
- **Evals cost money and run by hand** (`bun run evals`, `evals/`), with the gateway
  credentials in the environment: golden questions, inference, the unanswerable and the
  adversarial, scored by rules and by a judge against the whole knowledge. The judge is
  of another family than the model it grades (`ASK_JUDGE`, GPT-5 mini by default), as a model rates its own answers too kindly. Run
  them after any change to the prompts or the knowledge, and put the scores in the PR.
  Evalite does not pass the environment to its workers: `evals/setup.ts` loads
  `.env.local` (`vercel env pull`), whose OIDC token lasts about twelve hours. Run them
  twice: one pass can be lucky.
