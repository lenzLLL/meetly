import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{js,ts,tsx}"],
    rules: Object.fromEntries(
      Object.keys((await import("eslint/conf/eslint-all")).default.rules).map((r) => [r, "off"])
    ),
  },
];
