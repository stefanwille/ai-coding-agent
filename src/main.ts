import { createAgentSession } from "./agent/agent-session";
import { agentRequest } from "./agent/agent-request";
import {
  loadReadlineHistory,
  saveReadlineHistory,
} from "./agent/readline/readline-history";
import { createReadlineSession } from "./agent/readline/readline";
import { text } from "node:stream/consumers";

async function repl() {
  console.log("running REPL");

  const history = await loadReadlineHistory();
  const readlineSession = createReadlineSession(history);
  const agentSession = await createAgentSession();

  for (;;) {
    const line = await readlineSession.promptUser("> ");
    if (line === null || line === "exit" || line === "quit") {
      break;
    }
    if (!line) continue;
    await saveReadlineHistory(readlineSession.getHistory());
    await agentRequest(line, agentSession);
  }
}

async function executeStdin() {
  console.log("running CLI");

  const input = await text(process.stdin);
  const agentSession = await createAgentSession();
  await agentRequest(input, agentSession);
}

async function main() {
  if (process.stdin.isTTY) {
    await repl();
  } else {
    await executeStdin();
  }

  process.exit(0);
}

main().catch(console.error);
