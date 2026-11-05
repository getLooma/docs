// The changelog's Atom feed (openspec change `changelog`, design.md D4).
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { atomFeed } from '../../lib/changelog.mjs';
import { site as defaultSite } from '../../sections.mjs';

export const GET: APIRoute = async ({ site }) => {
  const entries = (await getCollection('changelog')).map((e) => ({
    id: e.id,
    date: e.data.date,
    title: e.data.title,
    category: e.data.category,
    html: e.rendered?.html ?? '',
  }));
  return new Response(atomFeed(entries, (site ?? new URL(defaultSite)).origin), {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
};
