# ARM project handoff (offline example)

The same synthetic task is readable by a user-selected lead in AO or by an independent
harness with only Git and Node. No daemon, provider account, dependency install or board is
needed for the checks. Run from this repository's root:

```sh
node examples/arm-project-handoff/handoff.mjs
node --test examples/arm-project-handoff/handoff.test.mjs
```

The first command checks one synthetic length field, prints its measured payload size with
scope and input fingerprints, and keeps the DMA hypothesis and protocol proposal separate.
A changed contract or sample produces a nonzero exit instead of a stale answer. A human
decision is deliberately still outstanding; no prior approval is invented by this fixture.
The test suite makes a fresh local Git clone, removes the source checkout, and reads the task
with a nonexistent AO data directory. No application state is written by the checker.

## Connect the rules to AO

For an **opt-in test project** with these files committed at the same paths, choose the
operator's desired Orchestrator harness/model/effort in AO Project Settings. Set worker
settings separately. To attach the example rules to both roles on that project:

```sh
ao project set-config <project-id> --agent-rules-file examples/arm-project-handoff/rules.md --orchestrator-rules-file examples/arm-project-handoff/rules.md
```

These fields replace the two rules-file pointers; do not point a production project at this
example. AO reads the repository-relative files at session start, so use a new session and
verify its worktree has the intended revision. See [AO project settings](../../frontend/src/docs/content/configuration/projects.mdx).
Outside AO, use the same rules file and command. Preserve the task inputs in Git before a
handoff; session histories and AO's database are not engineering evidence.

This is a single-project handoff check, **not** an approval service, sandbox, writer lock,
automatic lead replacement or model-quality benchmark. The fixture supports the pending
decision only. Hashes detect drift against a trusted task revision, not a writer changing
both the inputs and their hashes. Run verification from an independently reviewed revision;
use the project's actual decision authority, access controls and hardware tests in real work.
