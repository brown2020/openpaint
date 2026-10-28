import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const componentTestPattern = "src/components/**/*.test.ts";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: [componentTestPattern],
        },
      },
      {
        extends: true,
        test: {
          environment: "jsdom",
          include: [componentTestPattern],
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(root, "./src"),
    },
  },
});
