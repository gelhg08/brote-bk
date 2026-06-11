#!/usr/bin/env node
/**
 * Brote — Lint + Tests al cerrar (Stop). Portable: corre con Node en Win/macOS/Linux.
 *
 * Hace cumplir la Regla #2 ("testing local obligatorio"): cuando Claude termina su
 * respuesta, corre `npm run lint` y `npm test` si existen. Si alguno falla, BLOQUEA el
 * cierre (exit 2) y devuelve la salida para que Claude lo corrija antes de terminar.
 *
 * No hace nada (exit 0) si:
 *   - no existe package.json todavía (el scaffold de NestJS aún no se hizo),
 *   - no hay scripts `lint`/`test`,
 *   - ya venimos de un reintento de Stop (stop_hook_active) → evita bucles,
 *   - la variable CLAUDE_SKIP_STOP_TESTS está definida (escape manual).
 */
import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    const t = setTimeout(() => resolve(data), 2000);
    if (t.unref) t.unref();
  });
}

const raw = await readStdin();
let input = {};
try {
  input = JSON.parse(raw);
} catch {
  /* sin JSON → seguimos con defaults */
}

if (process.env.CLAUDE_SKIP_STOP_TESTS) process.exit(0);
if (input.stop_hook_active) process.exit(0); // evita bucle de Stop

const root = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const pkgPath = join(root, 'package.json');
if (!existsSync(pkgPath)) process.exit(0); // backend aún no scaffoldeado

let scripts = {};
try {
  scripts = JSON.parse(readFileSync(pkgPath, 'utf8')).scripts || {};
} catch {
  process.exit(0);
}

const steps = [];
if (scripts.lint) steps.push(['Lint', 'npm run lint']);
if (scripts.test) steps.push(['Tests', 'npm test']);
if (steps.length === 0) process.exit(0);

for (const [label, command] of steps) {
  try {
    execSync(command, {
      cwd: root,
      stdio: 'pipe',
      env: { ...process.env, CI: 'true' },
      timeout: 9 * 60 * 1000,
    });
  } catch (e) {
    const out = `${e.stdout?.toString() || ''}\n${e.stderr?.toString() || ''}`.trim().slice(-4000);
    process.stderr.write(
      `⛔ [cierre Brote] ${label} falló. No des la tarea por terminada hasta que pase (Regla #2).\n` +
        `Comando: ${command}\n--- últimas líneas ---\n${out}\n`,
    );
    process.exit(2); // bloquea el Stop → Claude debe corregir y reintentar
  }
}

process.exit(0);
