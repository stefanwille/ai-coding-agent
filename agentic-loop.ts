import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert";
import { type } from "arktype";
import type { ToolResultBlockParam } from "@anthropic-ai/sdk/resources";

const MODEL = "claude-haiku-4-5";

const getLocationSchema = type({
  type: "object",
  properties: {},
  required: [],
});

const getWeatherSchema = type({
  location: "string",
});

type getWeatherInput = typeof getWeatherSchema.infer;

async function get_location(): Promise<string> {
  console.log(`Getting location`);
  return "Berlin, Germany";
}

async function get_weather({ location }: getWeatherInput): Promise<string> {
  console.log(`Getting weather for ${location}`);
  if (location === "San Francisco, CA") {
    return "Very hot and dry, at 52 degrees Celsius.";
  }
  if (location === "Berlin, Germany") {
    return "Sunny and friendly, at 16 degrees Celsius.";
  }
  return "Unknown location";
}

type ToolType = {
  name: string;
  description: string;
  inputSchema: type.Any;
  jsFunction: (input: any) => Promise<ToolResultBlockParam["content"]>;
};

const toolTypeTools: ToolType[] = [
  {
    name: "get_location",
    description: "Get the user's location",
    inputSchema: getLocationSchema,
    jsFunction: get_location,
  },
  {
    name: "get_weather",
    description: "Get the current weather in a given location",
    inputSchema: getWeatherSchema,
    jsFunction: get_weather,
  },
];

function getTools(toolTypeTools: ToolType[]): Anthropic.Messages.ToolUnion[] {
  return toolTypeTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema.toJsonSchema() as any,
  }));
}

const tools: Anthropic.Messages.ToolUnion[] = getTools(toolTypeTools);

async function invokeTool(
  toolName: string,
  toolInput: any,
  toolTypeTools: ToolType[],
): Promise<ToolResultBlockParam["content"]> {
  const toolTypeTool = toolTypeTools.find((tool) => tool.name === toolName);
  if (!toolTypeTool) {
    return `Unknown tool name: ${toolName}`;
  }
  return await toolTypeTool.jsFunction(toolInput);
}

async function executeToolUse(
  toolUse: Anthropic.Messages.ToolUseBlockParam,
): Promise<Anthropic.Messages.ToolResultBlockParam> {
  const toolName = toolUse.name;
  const toolInput = toolUse.input;
  const toolResponse = await invokeTool(toolName, toolInput, toolTypeTools);
  const toolResult: Anthropic.Messages.ToolResultBlockParam = {
    type: "tool_result" as const,
    tool_use_id: toolUse.id,
    content: toolResponse,
  };
  return toolResult;
}

async function main() {
  let turns = 0;
  const anthropic = new Anthropic();
  const messages: Anthropic.Messages.MessageParam[] = [];

  messages.push({
    role: "user" as const,
    content:
      "Get the user's location and the current weather in that location.",
  });

  while (turns < 10) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      tools: tools,
      messages,
    });
    console.log("response 0:", response);
    console.log("--------------------------------");
    messages.push({ role: response.role, content: response.content });

    if (
      response.stop_reason === "end_turn" ||
      response.stop_reason === "stop_sequence"
    ) {
      break;
    }

    assert(response.stop_reason === "tool_use", "Expected tool use in content");

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const content of response.content) {
      if (content.type === "tool_use") {
        const toolResult = await executeToolUse(content);
        toolResults.push(toolResult);
      }
    }

    messages.push({ role: "user", content: toolResults });

    turns++;
  }

  // console.log("Final messages:", messages);
}

main().catch(console.error);
