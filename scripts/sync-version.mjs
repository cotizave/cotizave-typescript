// Keeps SDK_VERSION in src/config.ts in sync with package.json.
//
// Runs automatically as npm's `version` lifecycle script, so `npm version`
// (and the release workflow) update the constant in the same commit that bumps
// package.json. A test asserts the two never drift.
import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const configPath = new URL('../src/config.ts', import.meta.url);
const source = readFileSync(configPath, 'utf8');

const pattern = /export const SDK_VERSION = '[^']*';/;
if (!pattern.test(source)) {
  console.error('sync-version: could not find the SDK_VERSION declaration in src/config.ts');
  process.exit(1);
}

const updated = source.replace(pattern, `export const SDK_VERSION = '${pkg.version}';`);
if (updated !== source) {
  writeFileSync(configPath, updated);
  console.log(`sync-version: SDK_VERSION set to ${pkg.version}`);
}
