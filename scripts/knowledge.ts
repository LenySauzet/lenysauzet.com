import { projects as cards } from '@/content/projects';
import { readBlog } from '@/lib/assistant/knowledge/blog';
import { CORE_TOKEN_BUDGET, coreTokens, problemsOf, untold } from '@/lib/assistant/knowledge/check';
import { readKnowledge } from '@/lib/assistant/knowledge/load';

const { warnings, ...blog } = await readBlog();
const corpus = { ...(await readKnowledge()), blog };
const problems = problemsOf(corpus, cards);
const core = coreTokens(corpus);

console.log(`Projects told: ${corpus.stories.length} of ${cards.length}`);
console.log(`Untold: ${untold(corpus, cards).join(', ') || 'none'}`);
console.log(`FAQ answers: ${corpus.faq.length}`);
console.log(`Blog posts: ${blog.posts.map((post) => post.slug).join(', ') || 'none'}`);
console.log(`Core: about ${core} tokens of ${CORE_TOKEN_BUDGET}`);
warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
problems.forEach((problem) => console.error(`Problem: ${problem}`));

if (problems.length || core > CORE_TOKEN_BUDGET) process.exit(1);
