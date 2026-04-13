import { defineConfig, globalIgnores } from "eslint/config";
import { createRequire } from "node:module";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-plugin-react@7.x is not yet compatible with eslint 10 —
// its rules crash with "contextOrFilename.getFilename is not a function".
// Build an override object that turns every react/ rule off.
const require_ = createRequire(import.meta.url);
const reactPluginPath = require_.resolve("eslint-plugin-react", {
  paths: [require_.resolve("eslint-config-next")],
});
const reactPlugin = require_(reactPluginPath);
const reactRulesOff = Object.fromEntries(
  Object.keys(reactPlugin.rules).map((r) => [`react/${r}`, "off"]),
);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  { rules: reactRulesOff },
]);

export default eslintConfig;
