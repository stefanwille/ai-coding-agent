import { type } from "arktype";
import type { Tool } from "../tool";

const getWeatherSchema = type({
  "+": "reject",
  location: "string",
});

export const get_weather: Tool = {
  name: "get_weather",
  description: "Get the current weather in a given location",
  inputSchema: getWeatherSchema,
  run: async ({ location }: typeof getWeatherSchema.infer) => {
    if (location === "San Francisco, CA") {
      return "Very hot and dry, at 52 degrees Celsius.";
    }
    if (location === "Berlin, Germany") {
      return "Sunny and friendly, at 16 degrees Celsius.";
    }
    return "Unknown location";
  },
};
