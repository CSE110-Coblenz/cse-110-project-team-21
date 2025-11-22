import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["dist/**"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      "no-unused-vars": "warn",
    },
  },
];
