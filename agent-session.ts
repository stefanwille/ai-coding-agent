import type Anthropic from "@anthropic-ai/sdk";
import { BashSession } from "./BashSession";
import { loadSystemPrompt } from "./system-prompt";
import { createTools, type Tool } from "./tools";

export type AgentSession = {
  messages: Anthropic.Messages.MessageParam[];
  // System prompt
  system?: string;
  tools: Tool[];
  anthropicTools: Anthropic.Messages.ToolUnion[];
  max_tokens: number;
  max_turns: number;
  model: string;
};

function convertTools(tools: Tool[]): Anthropic.Messages.ToolUnion[] {
  const convertedTools: Anthropic.Messages.ToolUnion[] = tools.map((tool) => {
    if (tool.name === "bash") {
      return {
        type: "bash_20250124",
        name: tool.name,
      };
    }
    return {
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema.toJsonSchema() as any,
    };
  });
  return convertedTools;
}

export async function createAgentSession(model: string): Promise<AgentSession> {
  const tools = createTools(new BashSession());
  const anthropicTools = convertTools(tools);
  const systemPrompt = await loadSystemPrompt();
  const session: AgentSession = {
    messages: [],
    system: systemPrompt,
    tools,
    anthropicTools,
    max_tokens: 8192,
    max_turns: 20,
    model,
  };
  return session;
}
