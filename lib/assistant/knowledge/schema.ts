import { z } from 'zod';

const yearOrMonth = z.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, 'a year as YYYY or a month as YYYY-MM');
const day = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'a day as YYYY-MM-DD');
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'a kebab-case slug');
const text = z.string().trim().min(1);

const period = z.object({ start: yearOrMonth, end: yearOrMonth.optional() });

export const profileSchema = z.strictObject({
  headline: text,
  summary: text,
  availability: z.strictObject({
    status: z.enum(['open', 'interviewing', 'employed']),
    start: z.union([z.literal('immediately'), day]),
    roles: z.array(text).min(1),
    locations: z.array(text).min(1),
    contracts: z.array(z.enum(['permanent', 'fixed-term', 'freelance'])).min(1),
    workAuthorization: text,
  }),
  languages: z.array(z.strictObject({ name: text, level: text })).min(1),
  education: z.array(
    z.strictObject({
      school: text,
      degree: text,
      location: text.optional(),
      ...period.shape,
      details: z.array(text).default([]),
    })
  ),
  experience: z
    .array(
      z.strictObject({
        company: text,
        role: text,
        location: text.optional(),
        arrangement: z.enum(['onsite', 'hybrid', 'remote']).optional(),
        contract: z.enum(['full-time', 'work-study', 'internship', 'freelance']),
        ...period.shape,
        summary: text,
        highlights: z.array(text).min(1),
        stack: z.array(text).default([]),
      })
    )
    .min(1),
  skills: z.array(z.strictObject({ area: text, items: z.array(text).min(1) })).min(1),
  certifications: z
    .array(
      z.strictObject({
        name: text,
        issuer: text,
        status: z.enum(['planned', 'in-progress', 'obtained']),
        date: day.optional(),
        level: text.optional(),
      })
    )
    .default([]),
  interests: z.array(text).default([]),
  recommendations: z
    .array(
      z.strictObject({
        author: text,
        role: text,
        relation: text,
        date: day,
        language: z.enum(['en', 'fr']),
        quote: text,
      })
    )
    .default([]),
});

export const STORY_SECTIONS = ['Context', 'What I built', 'Hard parts', 'Results', 'What I would do differently'] as const;
export const REQUIRED_SECTIONS = ['Context', 'What I built'] as const;

export const storySchema = z.strictObject({
  slug,
  title: text,
  year: z.string().regex(/^\d{4}$/),
  status: z.enum(['shipped', 'in-progress', 'archived']),
  role: z.enum(['solo', 'lead', 'contributor']),
  stack: z.array(text).min(1),
  repo: z.url().optional(),
  app: z.url().optional(),
  blogPosts: z.array(slug).default([]),
  summary: text,
});

export const faqSchema = z.strictObject({
  id: slug,
  question: text,
  topics: z.array(slug).min(1),
});

export const postSchema = z.object({
  title: text,
  description: text,
  date: day,
  updated: day.optional(),
  tags: z.array(text).default([]),
});

export type Profile = z.infer<typeof profileSchema>;
export type StoryFacts = z.infer<typeof storySchema>;
export type FaqFacts = z.infer<typeof faqSchema>;
export type PostFacts = z.infer<typeof postSchema>;
