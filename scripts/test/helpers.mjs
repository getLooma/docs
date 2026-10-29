// Fixture trees for the check-script tests: a minimal passing repository, mutated per test.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'docs-check-'));
}

export function write(root, rel, text) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

export const page = (title, description, body = 'Body text.\n', extra = '') =>
  `---\ntitle: ${title}\ndescription: ${description}\n${extra}---\n\n${body}`;

export const DESC = 'A description that is long enough to satisfy the fifty character minimum.';
