// Generates src/types/generated.ts from the OpenAPI v2 contract.
// The output is committed and MUST NOT be edited by hand: re-run
// `npm run generate:types` whenever openapi/cotizave-v2.yaml changes.
//
// CI runs this script and fails if the committed output drifts from the spec
// (see .github/workflows/ci.yml), so the types can never silently fall behind.
import { writeFile } from 'node:fs/promises';
import openapiTS, { astToString } from 'openapi-typescript';

const SPEC = new URL('../openapi/cotizave-v2.yaml', import.meta.url);
const OUT = new URL('../src/types/generated.ts', import.meta.url);

const banner = `/**
 * DO NOT EDIT MANUALLY.
 * Generated from openapi/cotizave-v2.yaml by \`npm run generate:types\`.
 */
/* eslint-disable */

`;

async function main() {
  // openapi-typescript parses and validates the document; a malformed spec
  // throws here and fails the command (and CI).
  const ast = await openapiTS(SPEC, {
    rootTypes: false,
    alphabetize: true,
  });
  const body = astToString(ast);
  await writeFile(OUT, banner + body, 'utf8');
  console.log(`Wrote ${OUT.pathname}`);
}

main().catch((err) => {
  console.error('Type generation failed:', err);
  process.exit(1);
});
