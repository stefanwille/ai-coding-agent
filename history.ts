const HISTORY_FILE = "history.txt";
const MAX_HISTORY_LINES = 200;

export async function loadHistory(): Promise<string[]> {
  try {
    const file = Bun.file(HISTORY_FILE);
    if (await file.exists()) {
      const text = await file.text();
      return text.split("\n").filter(Boolean).slice(-MAX_HISTORY_LINES);
    }
  } catch {}
  return [];
}

export async function saveHistory(lines: string[]) {
  const recentLines = lines.slice(-MAX_HISTORY_LINES);
  const existing = (await Bun.file(HISTORY_FILE).exists())
    ? (await Bun.file(HISTORY_FILE).text()).trim()
    : "";
  const updated = existing
    ? existing + "\n" + recentLines.join("\n")
    : recentLines.join("\n");
  await Bun.write(HISTORY_FILE, updated + "\n");
}
