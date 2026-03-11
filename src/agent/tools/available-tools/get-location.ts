import { type } from "arktype";
import type { Tool } from "../tool";

export const get_location: Tool = {
  name: "get_location",
  description: "Get the user's location",
  inputSchema: type({ "+": "reject" }),
  run: async () => {
    return "Berlin, Germany";
  },
};
