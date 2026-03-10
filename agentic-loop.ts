import Anthropic from "@anthropic-ai/sdk";
import { createInterface } from "node:readline";
import { BashSession, type BashToolInput } from "./BashTool";
import {
  type Tool,
  type ToolResult,
  get_location,
  get_weather,
  read_file,
  TOOLS,
} from "./tools";
import { renderMarkdown, renderToolFrame } from "./render-markdown";
import { loadHistory, saveHistory } from "./history";
import { createAgentSession, type AgentSession } from "./agent-session";

const MODEL = "claude-haiku-4-5";

const anthropic = new Anthropic();

async function executeToolUse(
  toolUse: Anthropic.Messages.ToolUseBlockParam,
  session: AgentSession,
): Promise<Anthropic.Messages.ToolResultBlockParam> {
  let result: ToolResult;

  if (toolUse.name === "bash") {
    const input = toolUse.input as BashToolInput;
    try {
      if (input.restart) {
        session.bashSession.restart();
        result = "Bash baseSession restarted.";
      } else {
        result = await session.bashSession.run(input.command, input.timeout);
      }
    } catch (err) {
      result = `Error: ${(err as Error).message}`;
    }
  } else {
    const tool = TOOLS.find((t) => t.name === toolUse.name);
    if (!tool) {
      return {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: `Unknown tool name: ${toolUse.name}`,
      };
    }
    result = await tool.jsFunction(toolUse.input);
  }

  const resultStr =
    typeof result === "string" ? result : JSON.stringify(result, null, 2);
  console.log(renderToolFrame(toolUse.name, toolUse.input, resultStr ?? ""));

  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: result,
  };
}

async function agentRequest(line: string, session: AgentSession) {
  let turns = 0;
  session.messages.push({
    role: "user",
    content: line,
  });

  while (turns < session.max_turns) {
    const response = await anthropic.messages.create({
      model: session.model,
      max_tokens: session.max_tokens,
      system: session.system || undefined,
      tools: session.tools,
      messages: session.messages,
    });
    session.messages.push({ role: response.role, content: response.content });

    if (response.stop_reason !== "tool_use") {
      break;
    }

    const toolUses = response.content.filter(
      (c): c is Anthropic.Messages.ToolUseBlock => c.type === "tool_use",
    );
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      toolResults.push(await executeToolUse(toolUse, session));
    }

    session.messages.push({ role: "user", content: toolResults });

    turns++;
  }
  return session.messages;
}

function createPrompt(history: string[]): {
  ask: (prompt: string) => Promise<string | null>;
  getHistory: () => string[];
} {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    history,
  });

  let closed = false;
  rl.once("close", () => {
    closed = true;
  });

  return {
    ask: (prompt: string) =>
      new Promise<string | null>((resolve) => {
        if (closed) return resolve(null);
        rl.once("close", () => resolve(null));
        rl.question(prompt, (answer) => {
          rl.removeAllListeners("close");
          resolve(answer);
        });
      }),
    getHistory: () => (rl as any).history as string[],
  };
}

async function main() {
  const history = await loadHistory();
  const session = await createAgentSession(MODEL);
  const { ask, getHistory } = createPrompt(history);

  for (;;) {
    const line = await ask("> ");
    if (line === null) {
      await saveHistory(getHistory());
      break;
    }
    if (!line) continue;

    session.messages = await agentRequest(line, session);

    const lastContent = session.messages.at(-1)!.content;
    if (Array.isArray(lastContent)) {
      for (const block of lastContent) {
        if (block.type === "text") {
          console.log(renderMarkdown(block.text));
        }
      }
    }
  }
}

main().catch(console.error);
