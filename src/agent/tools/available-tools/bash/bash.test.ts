import { describe, it, expect, afterEach } from "bun:test";
import { bash } from "./bash";
import { BashSession } from "./bash-session";

let session: BashSession;

afterEach(() => {
  session?.restart();
});

describe("bash - run", () => {
  it("executes a command and returns its stdout", async () => {
    session = new BashSession();
    const tool = bash(session);
    const result = await tool.run({ command: "echo hello" });
    expect(result).toBe("hello");
  });

  it("returns multi-line output", async () => {
    session = new BashSession();
    const tool = bash(session);
    const result = await tool.run({
      command: "printf 'line1\\nline2\\nline3'",
    });
    expect(result).toBe("line1\nline2\nline3");
  });

  it("preserves state across sequential commands", async () => {
    session = new BashSession();
    const tool = bash(session);
    await tool.run({ command: "export TEST_VAR_BASH=persistent" });
    const result = await tool.run({ command: "echo $TEST_VAR_BASH" });
    expect(result).toBe("persistent");
  });

  it("captures stderr in the output", async () => {
    session = new BashSession();
    const tool = bash(session);
    const result = await tool.run({ command: "echo oops >&2" });
    expect(result).toBe("oops");
  });

  it("merges stdout and stderr together", async () => {
    session = new BashSession();
    const tool = bash(session);
    const result = await tool.run({
      command: "echo out && echo err >&2",
    });
    expect(result).toContain("out");
    expect(result).toContain("err");
  });

  it("trims trailing whitespace from output", async () => {
    session = new BashSession();
    const tool = bash(session);
    const result = await tool.run({ command: "echo '  padded  '" });
    expect(result).toBe("padded");
  });

  it("truncates output exceeding 30,000 characters", async () => {
    session = new BashSession();
    const tool = bash(session);
    const result = await tool.run({
      command: "python3 -c \"print('A' * 40000)\"",
    });
    expect(typeof result).toBe("string");
    expect((result as string).length).toBe(30_000);
  });

  it("returns empty string for a no-output command", async () => {
    session = new BashSession();
    const tool = bash(session);
    const result = await tool.run({ command: "true" });
    expect(result).toBe("");
  });

  it("rejects when command exceeds the timeout", async () => {
    session = new BashSession();
    const tool = bash(session);
    const promise = tool.run({ command: "sleep 10", timeout: 200 });
    await expect(promise).rejects.toThrow("timed out");
  });
});

describe("bash - restart", () => {
  it("returns the fixed restart message", async () => {
    session = new BashSession();
    const tool = bash(session);
    const result = await tool.run({ restart: true });
    expect(result).toBe("Bash session restarted.");
  });

  it("clears session state after restart", async () => {
    session = new BashSession();
    const tool = bash(session);

    await tool.run({ command: "export RESTART_TEST=before" });
    await tool.run({ restart: true });
    const result = await tool.run({ command: "echo ${RESTART_TEST:-empty}" });
    expect(result).toBe("empty");
  });

  it("allows running commands after restart", async () => {
    session = new BashSession();
    const tool = bash(session);

    await tool.run({ restart: true });
    const result = await tool.run({ command: "echo works" });
    expect(result).toBe("works");
  });
});
