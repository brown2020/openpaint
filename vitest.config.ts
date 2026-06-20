import path from "node:path";
import { defineConfig } from "vitest/config";

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
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
