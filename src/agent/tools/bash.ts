import type { BashSession } from "./bash-session";
import type { Tool } from "./tool";

type BashToolInput =
  | { command: string; timeout?: number; restart?: never }
  | { restart: true; command?: never; timeout?: never };

export function bash(bashSession: BashSession): Tool {
  return {
    name: "bash",
    description: "Run a command in the bash shell",
    run: async (input: BashToolInput) => {
      if (input.restart) {
        bashSession.restart();
        return "Bash session restarted.";
      }
      return await bashSession.run(input.command, input.timeout);
    },
  };
}
