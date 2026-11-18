import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { handoff } from "./handoff.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const text = (name) => readFileSync(join(here, name), "utf8");

/** Load an independent copy so a negative test cannot alter the checked-in record. */
function fixture() {
  return [JSON.parse(text("task.json")), text("contract.json"), text("frame.hex")];
}

test("fresh Git clone recovers the task with neither AO state nor an old checkout", (t) => {
  const scratch = mkdtempSync(join(tmpdir(), "arm-handoff-"));
  t.after(() => rmSync(scratch, { recursive: true, force: true }));
  const seed = join(scratch, "seed");
  const clone = join(scratch, "new-checkout");
  mkdirSync(seed);
  const files = ["contract.json", "frame.hex", "handoff.mjs", "task.json"];
  for (const name of files) copyFileSync(join(here, name), join(seed, name));
  // Only commit published inputs to the disposable project; no AO files or chat logs.
  execFileSync("git", ["init", "-q", seed]);
  execFileSync("git", ["-C", seed, "add", "--", ...files]);
  execFileSync("git", ["-C", seed, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
    "-c", "commit.gpgsign=false", "-c", "core.hooksPath=unused-hooks", "commit", "-qm", "synthetic fixture"]);
  execFileSync("git", ["clone", "--quiet", "--no-local", seed, clone]);
  rmSync(seed, { recursive: true, force: true });
  const run = spawnSync(process.execPath, [join(clone, "handoff.mjs")], {
    cwd: scratch, encoding: "utf8", env: { ...process.env, AO_DATA_DIR: join(scratch, "absent") },
  });
  assert.equal(run.status, 0, run.stderr);
  const actual = JSON.parse(run.stdout);
  assert.equal(actual.task.id, "ARM-FRAME-001");
  assert.equal(actual.task.next, fixture()[0].next);
  assert.equal(actual.facts[0].observedPayloadBytes, 4);
  assert.equal(actual.facts[0].scope, "synthetic-host");
  assert.equal(actual.hypothesis.status, "unverified");
  assert.equal(actual.decision.status, "awaiting-human");
});

test("a contract change invalidates the observation before it can be reused", () => {
  const [task, contract, frame] = fixture();
  assert.throws(() => handoff(task, contract.replace("v1", "v2"), frame), /contract changed/);
});

test("old evidence cannot be attached to a different frame", () => {
  const [task, contract] = fixture();
  assert.throws(() => handoff(task, contract, "0400aabbccdd"), /frame changed/);
});

test("a proposed root cause or protocol change cannot be self-promoted", () => {
  const [task, contract, frame] = fixture();
  task.hypothesis.status = "confirmed";
  assert.throws(() => handoff(task, contract, frame), /unverified hypothesis/);
  task.hypothesis.status = "unverified";
  task.decision.status = "approved";
  assert.throws(() => handoff(task, contract, frame), /requires human review/);
});

test("a task cannot supply its own list of confirmed facts", () => {
  const [task, contract, frame] = fixture();
  task.facts = ["DMA cache fault proved on the board"];
  assert.throws(() => handoff(task, contract, frame), /unexpected task field/);
});
