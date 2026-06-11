# `.claude/` — Harness de Claude Code para Brote Backend

Configuración **local del repo** (versionada en git) y **portable** (Win/macOS/Linux). Compartida por el equipo.
La fuente de verdad del proyecto es `docs/PROYECTO.md`; las reglas siempre activas están en `/CLAUDE.md`.

## Estructura

```
CLAUDE.md            # memoria siempre activa (7 reglas, dinero, Wompi, git) + import de PROYECTO.md
.env.example         # plantilla de variables (copiar a .env; .env NO se versiona)
.mcp.json            # servidores MCP read-only (requieren tu aprobación)
.claude/
├── settings.json    # permisos (allow/deny/ask) + hooks
├── skills/          # investigacion-paralela · wompi-integracion · wompi-mocking · nestjs-modulo
├── agents/          # investigador · guardian-arquitectura · revisor-seguridad · revisor-performance · finalizador-feature
└── hooks/           # pre-tool-guard.mjs · stop-lint-test.mjs  (Node = portables)
```

## Hooks (Node, portables)

- **`pre-tool-guard.mjs`** (PreToolUse): **bloquea** llaves/URLs de producción de Wompi, `git push --force`
  y comandos `aws` que no sean de solo lectura. Devuelve exit 2 para abortar.
- **`stop-lint-test.mjs`** (Stop): al terminar, corre `npm run lint` y `npm test` si existen; si fallan,
  bloquea el cierre. Inerte si aún no hay `package.json`. Escape manual: `CLAUDE_SKIP_STOP_TESTS=1`.

Requisito: **Node ≥ 20** en el PATH (los hooks se invocan como `node script.mjs`).

## MCP read-only (en `.mcp.json`, requieren aprobación)

- **`mysql-readonly`** (`@bytebase/dbhub`, flag `--readonly`): inspección del esquema MySQL.
  Usa `DATABASE_URL_READONLY` con un usuario de BD **solo SELECT** (`GRANT SELECT ON brote.* TO 'brote_readonly'@'%'`).
- **`github-readonly`** (GitHub MCP HTTP): requiere `GITHUB_PAT` con **scopes de solo lectura**.
  Alternativa más liviana ya permitida: el CLI `gh` (solo subcomandos de lectura en `settings.json`).

Nada se conecta hasta que apruebes el servidor (`claude mcp list` → aprobar). No están auto-habilitados.

## Personalización personal (no compartida)

- `.claude/settings.local.json` y `CLAUDE.local.md` están en `.gitignore`: úsalos para tus overrides.
