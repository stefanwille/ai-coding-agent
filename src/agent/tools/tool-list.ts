import { bash } from "./available-tools/bash/bash";
import type { BashSession } from "./available-tools/bash/bash-session";
import { exitPlanMode } from "./available-tools/exit-plan-mode";
import { get_location } from "./available-tools/get-location";
import { get_weather } from "./available-tools/get-weather";
import { textEditor } from "./available-tools/text-editor/text-editor";
import type { Mode } from "../agent-session";
import {
  isAIAgentTool,
  type AnthropicTool,
  type ExtendedAnthropicTool,
  type Tool,
} from "./tool";

function toAnthropicTool({
  run: _run,
  ...tool
}: ExtendedAnthropicTool): AnthropicTool {
  return tool as AnthropicTool;
}

export function createTools(
  bashSession: BashSession,
  setMode: (mode: Mode) => void,
): Tool[] {
  return [
    get_location,
    get_weather,
    bash(bashSession),
    textEditor,
    exitPlanMode(setMode),
  ];
}

export function convertTools(tools: Tool[]): AnthropicTool[] {
  return tools.map((tool) => {
    if (isAIAgentTool(tool)) {
      // oxlint-disable-next-line typescript-eslint/no-explicit-any
      const inputSchema = tool.inputSchema?.toJsonSchema() as any;
      return {
        name: tool.name,
        description: tool.description,
        input_schema: inputSchema,
        strict: !!inputSchema,
      };
    } else {
      return toAnthropicTool(tool);
    }
  });
}
