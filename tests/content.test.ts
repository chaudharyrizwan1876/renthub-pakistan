import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("visible content style", () => {
  it("uses no em/en dashes in source strings (keeps copy human-written)", () => {
    const offenders: string[] = [];
    for (const f of walk(path.join(process.cwd(), "src"))) {
      fs.readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          const t = line.trim();
          if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
          if (/[–—]/.test(line)) offenders.push(`${path.relative(process.cwd(), f)}:${i + 1}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
