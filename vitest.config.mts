import { defineConfig } from "vitest/config";
import path from "node:path";

const rootDir = import.meta.dirname;

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Flight times are timezone-sensitive; pin the zone so a developer's local
    // settings cannot change what the suite asserts.
    env: { TZ: "UTC" },
  },
  resolve: {
    alias: { "@": path.resolve(rootDir, ".") },
  },
});
