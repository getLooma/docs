import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Required, bounded metadata on every page (docs-discoverability spec). Uniqueness across pages
// is checked on the build output by scripts/check-site.mjs.
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        title: z.string().min(1).max(60),
        description: z.string().min(50).max(160),
        faq: z
          .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }))
          .optional(),
      }),
    }),
  }),
  // Changelog entries (openspec change `changelog`). File names, body length and `docs` routes
  // are checked by scripts/check-repo.mjs.
  changelog: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/changelog' }),
    schema: z
      .object({
        date: z.coerce.date(),
        title: z.string().min(1).max(70),
        category: z.enum(['new', 'improved', 'fixed']),
        docs: z
          .string()
          .regex(/^\/([a-z0-9-]+\/)*$/)
          .optional(),
      })
      .strict(),
  }),
};
