import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // In production (GitHub Pages), the site lives at /z-asteroids/
  // In dev, it lives at /
  base: command === "build" ? "/z-asteroids/" : "/",
  server: {
    port: 5174,
    host: "0.0.0.0",
  },
  build: {
    target: "esnext",
  },
  test: {
    // Only run *.test.ts files inside src/ — exclude e2e Playwright specs
    include: ["src/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
  },
}));
