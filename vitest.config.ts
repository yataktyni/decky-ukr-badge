import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
  },
  resolve: {
    alias: {
      "@decky/manifest": "/tests/mocks/deckyManifest.ts",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setupTests.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
