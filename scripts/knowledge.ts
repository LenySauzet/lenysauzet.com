import { projects } from '@/content/projects';
import { readBlog } from '@/lib/assistant/knowledge/blog';
import { CORE_TOKEN_BUDGET, coreTokens, problemsOf, untold } from '@/lib/assistant/knowledge/check';
import { readKnowledge } from '@/lib/assistant/knowledge/load';

const knowledge = await readKnowledge();
const blog = await readBlog();
const corpus = { ...knowledge, posts: blog.posts };
const problems = problemsOf(corpus, projects, blog.complete);
const core = coreTokens(corpus);

console.log(`Projects told: ${corpus.projects.length} of ${projects.length}`);
console.log(`Untold: ${untold(corpus, projects).join(', ') || 'none'}`);
console.log(`FAQ answers: ${corpus.faq.length}`);
console.log(`Blog posts: ${corpus.posts.map((post) => post.slug).join(', ') || 'none'}`);
console.log(`Core: about ${core} tokens of ${CORE_TOKEN_BUDGET}`);
blog.warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
problems.forEach((problem) => console.error(`Problem: ${problem}`));

if (problems.length || core > CORE_TOKEN_BUDGET) process.exit(1);
