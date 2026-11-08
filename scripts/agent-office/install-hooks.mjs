import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const directory = new URL("../../.codex/", import.meta.url);
const script = fileURLToPath(new URL("./record-event.mjs", import.meta.url));
const windows = process.platform === "win32";
if (windows && /["%$`\r\n]/.test(script)) {
  throw new Error("O caminho do projeto contém caracteres incompatíveis com a configuração do hook.");
}

const quoted = windows ? '"' + script + '"' : "'" + script.replaceAll("'", "'\\''") + "'";
const command = "node " + quoted;
const hook = { type: "command", command, timeout: 3 };
const hooks = Object.fromEntries([
  "UserPromptSubmit", "Stop", "Interrupt", "SessionEnd",
  "SubagentStart", "SubagentStop", "PreModelRequest", "PreToolUse",
].map((event) => [
  event,
  [{
    ...(event === "PreToolUse" ? { matcher: "^(send_input|send_message|followup_task)$" } : {}),
    hooks: [hook],
  }],
]));

const configuration = {
  description: "Sala dos Agentes da Dogmania. Registra atividade local sem copiar conversas.",
  hooks,
};

mkdirSync(directory, { recursive: true });
try {
  writeFileSync(new URL("hooks.json", directory), JSON.stringify(configuration, null, 2) + "\n", {
    flag: "wx",
    mode: 0o600,
  });
  console.log("Configuração criada em .codex/hooks.json. Revise e autorize os hooks no Codex.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.error("Já existe .codex/hooks.json. Para preservar os hooks atuais, mescle os grupos abaixo manualmente:");
  console.log(JSON.stringify(configuration, null, 2));
  process.exitCode = 1;
}
