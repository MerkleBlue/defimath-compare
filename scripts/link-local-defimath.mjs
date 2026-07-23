// postinstall hook: if a local ../defimath sibling exists, symlink node_modules/defimath-lib
// over the npm-published version. Lets local edits (contracts, tolerances, helpers) surface
// in compare's tests without a publish cycle.
//
// If no sibling is present (fresh clone of just this repo, CI, etc.), the npm-published
// defimath-lib stays in place and tests still work.

import { existsSync, lstatSync, rmSync, symlinkSync } from "fs";
import { resolve } from "path";

const sibling = resolve("..", "defimath");
const target = resolve("node_modules", "defimath-lib");

if (!existsSync(`${sibling}/package.json`)) {
  console.log("[link-local-defimath] no ../defimath sibling — using npm-published defimath-lib");
  process.exit(0);
}

// Already linked? (symlink exists and points at the sibling)
if (existsSync(target) && lstatSync(target).isSymbolicLink()) {
  console.log("[link-local-defimath] already linked to ../defimath — nothing to do");
  process.exit(0);
}

// Replace the npm-installed directory with a symlink to the local sibling.
if (existsSync(target)) rmSync(target, { recursive: true, force: true });
symlinkSync(sibling, target, "dir");
console.log(`[link-local-defimath] linked node_modules/defimath-lib → ${sibling}`);
