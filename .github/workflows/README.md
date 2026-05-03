# Workflows de GitHub Actions — awf-platform

Este directorio contiene los pipelines CI/CD del repo `draweb/awf-platform`.

| Workflow | Disparador | Descripción |
|----------|-----------|-------------|
| `ci.yml` | Push a `main`/`master`, PRs | Build paquetes workspace, migraciones CI, tests, build Next.js. |
| `release-web-vercel.yml` | Tag `X.Y.Z` (solo dígitos) | Lo mismo que CI + migración producción + deploy Vercel (`vercel pull` / `build` / `deploy --prebuilt`). |

## Secretos requeridos (release)

Configurar en GitHub → Settings → Environments → `production`:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `DATABASE_URL_PRODUCTION`

Ver [`infra/vercel/README.md`](../../../infra/vercel/README.md) para detalles, troubleshooting y rotación.
