import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';

// One 1200x630 Open Graph image per page (docs-discoverability spec), at /og/<entry id>.png.
const entries = await getCollection('docs');
const pages = Object.fromEntries(entries.map(({ id, data }) => [id, data]));

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[24, 24, 46]],
    border: { color: [79, 70, 229], width: 24, side: 'inline-start' },
    padding: 80,
    font: {
      title: { size: 72, weight: 'Bold', families: ['Inter'], color: [255, 255, 255] },
      description: { size: 36, families: ['Inter'], color: [200, 200, 220] },
    },
    // Vendored (SIL OFL 1.1, src/fonts/OFL.txt) so the build needs no network.
    fonts: ['./src/fonts/inter-400.ttf', './src/fonts/inter-700.ttf'],
  }),
});
