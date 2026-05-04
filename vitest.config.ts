import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Next.js usa `jsx: "preserve"` en tsconfig. Vite 8 transforma con **Oxc** (no esbuild) salvo
 * `oxc: false`; hay que fijar `oxc.jsx` a runtime automático o los `.tsx` no compilan en Vitest.
 */
export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
      pragma: "React.createElement",
      importSource: "react",
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    globals: false,
    // Evita fallo al importar módulos que validan env (p. ej. lib/db vía cli-device).
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://awf_test:awf_test@127.0.0.1:5432/awf_test?schema=public",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
