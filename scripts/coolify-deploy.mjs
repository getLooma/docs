#!/usr/bin/env node
// Triggers the Coolify deployment of the docs application and waits for its outcome (design.md
// D13). The token needs only the `read` and `deploy` abilities: the application tracks
// ghcr.io/getlooma/docs:live, which CI moved before calling this. Reads COOLIFY_URL,
// COOLIFY_APP_UUID and COOLIFY_API_TOKEN from the environment and never prints them.
import { pathToFileURL } from 'node:url';

export const DONE = 'finished';
export const FAILED = ['failed', 'cancelled-by-user', 'cancelled'];

export async function deploy({
  url,
  app,
  token,
  fetchImpl = fetch,
  pollMs = 5000,
  timeoutMs = 15 * 60 * 1000,
  log = console.log,
}) {
  for (const [name, value] of Object.entries({
    COOLIFY_URL: url,
    COOLIFY_APP_UUID: app,
    COOLIFY_API_TOKEN: token,
  })) {
    if (!value) throw new Error(`${name} is not set`);
  }
  const base = url.replace(/\/+$/, '');
  const call = async (method, path) => {
    const res = await fetchImpl(`${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Coolify ${method} ${path.split('?')[0]} answered ${res.status}`);
    return res.json();
  };
  const started = await call('POST', `/api/v1/deploy?uuid=${encodeURIComponent(app)}&force=false`);
  const id = started?.deployments?.[0]?.deployment_uuid;
  if (!id) throw new Error('Coolify returned no deployment id');
  log(`deployment ${id} started`);
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { status } = await call('GET', `/api/v1/deployments/${encodeURIComponent(id)}`);
    if (status === DONE) return log(`deployment ${id} finished`);
    if (FAILED.includes(status)) throw new Error(`deployment ${id} ended as ${status}`);
    if (Date.now() > deadline)
      throw new Error(`deployment ${id} still ${status} after ${timeoutMs / 60000} minutes`);
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  deploy({
    url: process.env.COOLIFY_URL,
    app: process.env.COOLIFY_APP_UUID,
    token: process.env.COOLIFY_API_TOKEN,
  }).catch((e) => {
    console.error(`coolify-deploy: ${e.message}`);
    process.exit(1);
  });
}
