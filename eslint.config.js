import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  URL: "readonly",
  Buffer: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  window: "readonly",
  document: "readonly",
  getComputedStyle: "readonly",
  fetch: "readonly",
  Request: "readonly",
  Response: "readonly",
  Headers: "readonly",
  AbortController: "readonly",
  TextDecoder: "readonly",
  crypto: "readonly",
};

export default [
  {
    ignores: [
      "dist/**",
      ".astro/**",
      ".vercel/**",
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      "docs/**",
      "source/**",
      "scripts/perf/**",
      ".lighthouse/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { languageOptions: { globals: nodeGlobals } },
  {
    files: ["api/**/*.js", "scripts/**/*.mjs"],
    languageOptions: { globals: nodeGlobals },
  },
  { rules: { "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }] } },
];
