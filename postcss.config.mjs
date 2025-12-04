// Remove `@supports (color: lab(...)) { ... }` blocks from final CSS
// to avoid browsers/devtools that don't fully support CSS Color 4
// from logging "Attempting to parse an unsupported color function 'lab'".
// This keeps the existing fallbacks while removing the lab() support blocks.
const stripLabPlugin = () => ({
  postcssPlugin: "postcss-strip-lab-supports",
  Once(root) {
    root.walkAtRules("supports", (atRule) => {
      try {
        if (atRule.params && atRule.params.includes("lab(")) {
          atRule.remove();
        }
      } catch (e) {
        // be defensive: if anything goes wrong, leave the rule alone
      }
    });
  },
});
stripLabPlugin.postcss = true;

const config = {
  plugins: ["@tailwindcss/postcss", stripLabPlugin],
};

export default config;
