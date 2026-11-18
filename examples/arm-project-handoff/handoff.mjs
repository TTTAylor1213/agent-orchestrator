import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Resume this fixture's task only when its published evidence still reproduces. */
export function handoff(task, contractText, frameText) {
  const expectedKeys = ["id", "goal", "state", "next", "evidence", "hypothesis", "decision"];
  if (Object.keys(task).some((key) => !expectedKeys.includes(key))) throw Error("unexpected task field");
  if (![task.id, task.goal, task.next, task.hypothesis?.text, task.decision?.text]
    .every((s) => typeof s === "string" && s.trim()) || task.state !== "awaiting-decision") {
    throw Error("incomplete task handoff");
  }
  if (task.hypothesis.status !== "unverified") throw Error("expected an unverified hypothesis");
  if (task.decision.status !== "awaiting-human") throw Error("protocol change requires human review");

  // Git may check text out with CRLF. Pin the LF contract and the actual frame bytes.
  const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
  if (sha256(contractText.replaceAll("\r\n", "\n")) !== task.evidence?.contractSha256) {
    throw Error("contract changed; revalidate the dependent evidence");
  }
  const hex = frameText.trim();
  if (!/^(?:[\da-f]{2})+$/i.test(hex)) throw Error("invalid frame hex");
  const frame = Buffer.from(hex, "hex");
  if (sha256(frame) !== task.evidence.frameSha256) throw Error("frame changed; revalidate the evidence");

  const protocol = JSON.parse(contractText);
  if (protocol.revision !== "sim-frame-v1" || protocol.scope !== "synthetic-host" ||
      protocol.headerBytes !== 2 || protocol.lengthOrder !== "little-endian" || protocol.lengthCounts !== "payload") {
    throw Error("unsupported contract; do not carry this fact into another version");
  }
  const payloadBytes = frame.length - protocol.headerBytes;
  if (payloadBytes < 0 || frame.readUInt16LE(0) !== payloadBytes) throw Error("frame length mismatch");
  return {
    task: { id: task.id, goal: task.goal, state: task.state, next: task.next },
    // Facts are derived here, never copied from a worker's free-text assessment.
    facts: [{ scope: protocol.scope, revision: protocol.revision, observedPayloadBytes: payloadBytes,
      contractSha256: task.evidence.contractSha256, frameSha256: task.evidence.frameSha256 }],
    hypothesis: { status: "unverified", text: task.hypothesis.text },
    decision: { status: "awaiting-human", text: task.decision.text },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");
  try {
    console.log(JSON.stringify(handoff(JSON.parse(read("task.json")), read("contract.json"), read("frame.hex")), null, 2));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
