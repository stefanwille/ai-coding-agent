import type { ToolResultBlockParam } from "@anthropic-ai/sdk/resources";
import { type } from "arktype";

export type ToolResult = ToolResultBlockParam["content"];

export type Tool = {
  name: string;
  description: string;
  inputSchema?: type.Any;
  // oxlint-disable-next-line typescript-eslint/no-explicit-any
  run: (input: any) => Promise<ToolResult>;
};
