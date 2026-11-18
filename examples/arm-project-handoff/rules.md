# Synthetic ARM project

Read `examples/arm-project-handoff/task.json` and run `node examples/arm-project-handoff/handoff.mjs`
from your worktree root before resuming `ARM-FRAME-001`. A failure means stop using the old
fact and report which input changed. Do not rewrite a digest merely to make the check pass.

- Lead: use only the operator-selected harness/model. Delegate analysis, implementation,
  testing and independent review as needed. Escalate the protocol decision to the human;
  ordinary evidence gathering needs no new architecture decision.
- Worker: report against the task and contract revision. Preserve the sample and distinguish
  measured synthetic data, hypotheses and proposals. Do not edit another worker's handoff.
- Reviewer: rerun the check against the candidate input using a trusted copy of the checker.
  A reviewer's agreement is not a measurement or an approval. This example has no hardware data.
- Before replacing the lead, preserve work and evidence in an agreed Git revision, stop the old
  writer, and give the new lead the task ID and revision, not the old conversation. A worktree
  isolates file edits, not authority. Keep accepted findings as regression checks with scope.
