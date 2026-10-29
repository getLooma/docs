import { defineCollection, z } from 'astro:content';
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
};
