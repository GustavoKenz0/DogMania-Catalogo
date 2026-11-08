import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("../../.private/agent-office/", import.meta.url));
const hour = 3_600_000;
const sessionId = (value) =>
  typeof value === "string" && /^[\w:-]{1,128}$/.test(value)
    ? createHash("sha256").update(value).digest("hex").slice(0, 20)
    : undefined;
const profileId = (value) =>
  typeof value === "string" && /^[a-z][a-z0-9_-]{0,49}$/.test(value) ? value : "default";

function sanitize(input) {
  const session = sessionId(input.session_id);
  const agent = sessionId(input.agent_id);
  if (!session) return;
  const main = { session, actor: session, profile: "orchestrator" };
  const participant = { session, actor: agent, profile: profileId(input.agent_type) };

  switch (input.hook_event_name) {
    case "UserPromptSubmit":
      return { ...main, type: "started" };
    case "Stop":
    case "Interrupt":
      return { ...main, type: "stopped" };
    case "SessionEnd":
      return { ...main, type: "ended" };
    case "SubagentStart":
      return agent && { ...participant, type: "delegated", peer: session };
    case "SubagentStop":
      return agent && { ...participant, type: "stopped" };
    case "PreModelRequest":
      return { ...(agent ? participant : main), type: "working" };
    case "PreToolUse": {
      if (!["send_input", "send_message", "followup_task"].includes(input.tool_name)) return;
      const recipient = input.tool_input?.id ?? input.tool_input?.target ?? input.tool_input?.agent_id;
      const peer = sessionId(recipient);
      if (!peer || peer === (agent ?? session)) return;
      return { ...(agent ? participant : main), type: "contact", peer };
    }
  }
}

function record(event) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const now = Date.now();
  const nonce = randomUUID();
  const destination = join(directory, now + "-" + nonce + ".json");
  const temporary = destination + ".tmp";
  writeFileSync(temporary, JSON.stringify({ ...event, at: now }), { flag: "wx", mode: 0o600 });
  renameSync(temporary, destination);

  // Trim the local journal periodically. Readers ignore unfinished temporary files.
  if (nonce.startsWith("0")) {
    const entries = readdirSync(directory).filter((name) =>
      /^\d{13}-[0-9a-f-]{36}\.json(?:\.tmp)?$/.test(name),
    ).sort().reverse();
    for (const [index, name] of entries.entries()) {
      const age = now - Number(name.slice(0, 13));
      if (age > 24 * hour || (index >= 1500 && age > 5_000)) {
        rmSync(join(directory, name), { force: true });
      }
    }
  }
}

try {
  let body = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    body += chunk;
    if (body.length > 1_048_576) break;
  }
  if (body.length <= 1_048_576) {
    const event = sanitize(JSON.parse(body));
    if (event) record(event);
  }
} catch {
  // Monitoring must never interrupt the agent or print hook payloads.
}
process.stdout.write("{}\n");
