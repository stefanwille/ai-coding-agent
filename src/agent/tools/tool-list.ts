import type Anthropic from "@anthropic-ai/sdk";
import type { BashSession } from "./available-tools/bash-session";
import { bash } from "./available-tools/bash";
import { get_location } from "./available-tools/get-location";
import { get_weather } from "./available-tools/get-weather";
import type { Tool } from "./tool";

export function createTools(bashSession: BashSession): Tool[] {
  return [get_location, get_weather, bash(bashSession)];
}

export function convertTools(tools: Tool[]): Anthropic.Messages.ToolUnion[] {
  return tools.map((tool) => {
    if (tool.name === "bash") {
      return {
        type: "bash_20250124",
        name: tool.name,
      };
    }
    const inputSchema = tool.inputSchema?.toJsonSchema();
    return {
      name: tool.name,
      description: tool.description,
      // oxlint-disable-next-line typescript-eslint/no-explicit-any
      input_schema: inputSchema as any,
      strict: true,
    };
  });
}
