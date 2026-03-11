import { type } from "arktype";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";

export const CreateInputSchema = type({
  command: '"create"',
  path: "string",
  file_text: "string",
  "+": "reject",
});

type CreateInput = typeof CreateInputSchema.infer;

export async function create(input: CreateInput): Promise<string> {
  let stats;
  try {
    stats = await stat(input.path);
  } catch {
    stats = null;
  }

  if (stats !== null) {
    if (stats.isDirectory()) {
      return `Error: Path ${input.path} is a directory`;
    }
    return `Error: File ${input.path} already exists`;
  }

  await mkdir(dirname(input.path), { recursive: true });
  await Bun.write(input.path, input.file_text);
  return "Success";
}
