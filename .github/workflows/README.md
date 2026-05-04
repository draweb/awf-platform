# Workflows de GitHub Actions — awf-platform

Este directorio contiene los pipelines CI/CD del repo `draweb/awf-platform`.

| Workflow | Disparador | Descripción |
|----------|-----------|-------------|
| `ci.yml` | Push a `main`/`master`, PRs | Build paquetes workspace, migraciones CI, tests, build Next.js. |
| `release-web-vercel.yml` | Tag `X.Y.Z` (solo dígitos) | Cadena de jobs: validación de tag → **quality** (tests + build, sin secretos prod) → **migrate-production** (solo `DATABASE_URL_PRODUCTION`) → **deploy-vercel** (solo `VERCEL_*`). |

### Jobs del release (`release-web-vercel.yml`)

| Job | Entorno GitHub | Secretos |
|-----|----------------|----------|
| `validate-tag` | — | Ninguno |
| `quality` | *(ninguno)* | No usa `production`; solo Postgres de servicio en el runner |
| `migrate-production` | `production` | `DATABASE_URL_PRODUCTION` |
| `deploy-vercel` | `production` | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |

## Secretos requeridos (release)

Configurar en GitHub → Settings → Environments → `production`:

- `DATABASE_URL_PRODUCTION` (solo lo consumen `migrate-production` y, si en el futuro lo referenciás, otros jobs con `environment: production`)
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (solo `deploy-vercel`; el job `quality` no los inyecta)

Ver [`infra/vercel/README.md`](../../../infra/vercel/README.md) para detalles, troubleshooting y rotación.
