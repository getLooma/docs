// Astro integration: after the build, write the Content-Security-Policy fragment that
// deploy/Caddyfile imports (openspec change `support-chat-embed`). It allows the chat origin only
// when the support chat is configured for this build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP_FILE, cspCaddy } from '../../src/lib/support-chat.mjs';

/** @param {{ origin: string } | null} config */
export default function supportChatCsp(config) {
  return {
    name: 'looma-support-chat-csp',
    hooks: {
      'astro:build:done': ({ dir }) => {
        fs.writeFileSync(path.join(fileURLToPath(dir), CSP_FILE), cspCaddy(config));
      },
    },
  };
}
