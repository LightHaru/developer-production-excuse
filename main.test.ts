import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MAIN = fileURLToPath(new URL("./main.ts", import.meta.url));

function run(outDir: string): string {
  execFileSync(process.execPath, [MAIN, outDir]);
  return readFileSync(join(outDir, "entry.txt"), "utf8");
}

test("writes a deterministic single-line entry under 200 chars to entry.txt", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "excuse-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const outFile = join(dir, "entry.txt");
  const first = run(dir);
  const second = run(dir);

  assert.ok(existsSync(outFile), "entry.txt is written in the given directory");
  assert.equal(second, first, "output is deterministic across runs");
  assert.ok(first.trim().length > 0, "entry is not blank");
  assert.ok(!/[\r\n]/.test(first), "entry is a single line with no trailing newline");
  assert.ok([...first].length <= 199, "entry is at most 199 Unicode characters");
});

test("entry.txt lands at the requested output path, not beside it", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "excuse-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const nested = join(dir, "nested-out");
  run(nested);

  assert.ok(existsSync(join(nested, "entry.txt")), "honours the directory argument");
  assert.ok(!existsSync(join(dir, "entry.txt")), "does not leak to the parent directory");
});
