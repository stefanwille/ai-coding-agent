import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert";

const tools = [
  {
    name: "get_weather",
    description: "Get the current weather in a given location",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA",
        },
      },
      required: ["location"],
    },
  },
];

const get_weather = async (location: string): Promise<string> => {
  return "Very hot and dry, at 52 degrees Celsius.";
};

const executeToolUse = async (
  toolUse: Anthropic.Messages.ToolUseBlockParam,
): Promise<Anthropic.Messages.ToolResultBlockParam> => {
  const toolName = toolUse.name;
  assert(toolName === "get_weather", "Expected tool name to be get_weather");
  const toolInput = toolUse.input as { location: string };
  const toolResponse = await get_weather(toolInput.location);
  const toolResult: Anthropic.Messages.ToolResultBlockParam = {
    type: "tool_result" as const,
    tool_use_id: toolUse.id,
    content: toolResponse,
  };
  return toolResult;
};

async function main() {
  const anthropic = new Anthropic();
  const messages: Anthropic.Messages.MessageParam[] = [];

  messages.push({
    role: "user" as const,
    content: "What is the weather in San Francisco?",
  });
  const response0 = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1000,
    tools: tools,
    messages,
  });
  console.log("response 0:", response0);
  console.log("--------------------------------");
  messages.push({ role: response0.role, content: response0.content });

  const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

  for (const content of response0.content) {
    if (content.type === "tool_use") {
      const toolResult = await executeToolUse(content);
      toolResults.push(toolResult);
    }
  }
  messages.push({ role: "user", content: toolResults });

  const response1 = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1000,
    tools: tools,
    messages,
  });
  console.log("response 1:", response1);
}

main().catch(console.error);
