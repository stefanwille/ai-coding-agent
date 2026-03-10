const HISTORY_FILE = "history.txt";
const MAX_HISTORY_LINES = 200;

export async function loadHistory(): Promise<string[]> {
  try {
    const file = Bun.file(HISTORY_FILE);
    if (await file.exists()) {
      const text = await file.text();
      return text
        .split("\n")
        .filter(Boolean)
        .slice(-MAX_HISTORY_LINES)
        .reverse();
    }
  } catch {}
  return [];
}

export async function saveHistory(lines: string[]) {
  const recentLines = lines.toReversed().slice(-MAX_HISTORY_LINES);
  await Bun.write(HISTORY_FILE, recentLines.join("\n") + "\n");
}
