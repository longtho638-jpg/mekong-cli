/**
 * Deep Hydration Test Suite
 * =========================
 * Tests to catch SSR/Client hydration mismatches BEFORE CI/CD passes.
 *
 * Problem: toLocaleString() and Date formatting can differ between
 * server (Node.js) and client (Browser) locales, causing React hydration errors.
 *
 * Solution: These tests validate that all number/date formatting uses
 * consistent locales (en-US) to prevent hydration mismatches.
 */

import { expect, test, describe } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

const DASHBOARD_SRC = path.join(__dirname, "../../apps/dashboard");

// Patterns that cause hydration mismatches
const HYDRATION_ANTIPATTERNS = [
  {
    pattern: /\.toLocaleString\(\s*\)/g,
    message:
      'toLocaleString() without locale causes hydration mismatch. Use Intl.NumberFormat("en-US") instead.',
    severity: "error",
  },
  {
    pattern: /new Date\(\)\.toLocaleString\(\)/g,
    message:
      "Date.toLocaleString() causes hydration mismatch. Use date-fns or dayjs with explicit locale.",
    severity: "error",
  },
  {
    pattern: /Math\.random\(\)/g,
    message:
      "Math.random() in render causes hydration mismatch. Move to useEffect or use seeded random.",
    severity: "warning",
  },
  {
    pattern: /Date\.now\(\)/g,
    message:
      "Date.now() in render causes hydration mismatch. Move to useEffect.",
    severity: "warning",
  },
  {
    pattern: /typeof window !== ['"]undefined['"]/g,
    message:
      "Server/client branch can cause hydration mismatch. Consider using useEffect or dynamic import.",
    severity: "warning",
  },
];

// Recursively find all TSX files
function findTsxFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (
      item.isDirectory() &&
      !item.name.includes("node_modules") &&
      !item.name.startsWith(".")
    ) {
      files.push(...findTsxFiles(fullPath));
    } else if (
      item.isFile() &&
      (item.name.endsWith(".tsx") || item.name.endsWith(".ts"))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("Hydration Safety Tests", () => {
  const tsxFiles = findTsxFiles(DASHBOARD_SRC);

  test("should find TSX files to analyze", () => {
    expect(tsxFiles.length).toBeGreaterThan(0);
  });

  describe("Anti-pattern Detection", () => {
    for (const antipattern of HYDRATION_ANTIPATTERNS) {
      if (antipattern.severity === "error") {
        test(`should not contain: ${antipattern.message.slice(0, 50)}...`, () => {
          const violations: { file: string; line: number; match: string }[] =
            [];

          for (const file of tsxFiles) {
            const content = fs.readFileSync(file, "utf-8");
            const lines = content.split("\n");

            lines.forEach((line, index) => {
              const matches = line.match(antipattern.pattern);
              if (matches) {
                // Skip if it's a comment
                if (line.trim().startsWith("//") || line.trim().startsWith("*"))
                  return;

                violations.push({
                  file: path.relative(DASHBOARD_SRC, file),
                  line: index + 1,
                  match: matches[0],
                });
              }
            });
          }

          if (violations.length > 0) {
            const report = violations
              .map((v) => `  ${v.file}:${v.line} - ${v.match}`)
              .join("\n");
            throw new Error(
              `Found ${violations.length} hydration anti-patterns:\n${report}\n\n${antipattern.message}`,
            );
          }
        });
      }
    }
  });

  describe("Locale Consistency", () => {
    test("Intl.NumberFormat should use explicit locale", () => {
      const violations: string[] = [];

      for (const file of tsxFiles) {
        const content = fs.readFileSync(file, "utf-8");

        // Check for NumberFormat without locale
        if (content.includes("new Intl.NumberFormat()")) {
          violations.push(path.relative(DASHBOARD_SRC, file));
        }
      }

      expect(violations).toEqual([]);
    });
  });
});

// Export for use in other tests
export { HYDRATION_ANTIPATTERNS, findTsxFiles };
