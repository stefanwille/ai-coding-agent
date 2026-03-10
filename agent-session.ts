import type Anthropic from "@anthropic-ai/sdk";
import { BashSession } from "./BashTool";
import { loadSystemPrompt } from "./system-prompt";
import { tools, type Tool } from "./tools";

export type AgentSession = {
  messages: Anthropic.Messages.MessageParam[];
  system?: string;
  tools: Anthropic.Messages.ToolUnion[];
  max_tokens: number;
  max_turns: number;
  model: string;
  bashSession: BashSession;
};

function convertTools(tools: Tool[]): Anthropic.Messages.ToolUnion[] {
  const convertedTools: Anthropic.Messages.ToolUnion[] = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema.toJsonSchema() as any,
  }));
  convertedTools.push({ type: "bash_20250124", name: "bash" });
  return convertedTools;
}

export async function createAgentSession(model: string): Promise<AgentSession> {
  const anthropicTools = convertTools(tools);
  const systemPrompt = await loadSystemPrompt();
  let messages: Anthropic.Messages.MessageParam[] = [];
  const session: AgentSession = {
    messages: [],
    system: systemPrompt,
    tools: anthropicTools,
    max_tokens: 8192,
    max_turns: 10,
    model,
    bashSession: new BashSession(),
  };
  return session;
}
