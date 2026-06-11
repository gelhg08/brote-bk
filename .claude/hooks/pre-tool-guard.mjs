#!/usr/bin/env node
/**
 * Brote — Guardia de seguridad (PreToolUse). Portable: corre con Node en Win/macOS/Linux.
 *
 * BLOQUEA (exit 2) cuando detecta:
 *   1. Llaves o URLs de PRODUCCIÓN de Wompi (pub_prod_, prv_prod_, prod_events_,
 *      prod_integrity_, production.wompi.co) en comandos, escrituras o fetches.
 *   2. `git push --force` / `-f` / `--force-with-lease` (historia compartida).
 *   3. Comandos de nube `aws` que NO sean de solo lectura (Regla #7).
 *
 * Entrada: JSON de Claude Code por stdin ({ tool_name, tool_input, ... }).
 * Salida:  exit 0 = permitir · exit 2 = bloquear (stderr se muestra a Claude).
 */
import process from 'node:process';

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

function block(msg) {
  process.stderr.write(`⛔ [guardia Brote] ${msg}\n`);
  process.exit(2);
}

const PROD_WOMPI = [
  /production\.wompi\.co/i,
  /\bpub_prod_/i,
  /\bprv_prod_/i,
  /\bprod_events_/i,
  /\bprod_integrity_/i,
];

function scanProdWompi(text, where) {
  for (const re of PROD_WOMPI) {
    if (re.test(text)) {
      block(
        `Uso de PRODUCCIÓN de Wompi detectado (${re.source}) en ${where}. ` +
          `Regla #2: solo SANDBOX. Usa pub_test_/prv_test_/test_* y https://sandbox.wompi.co/v1.`,
      );
    }
  }
}

const raw = await readStdin();
let input;
try {
  input = JSON.parse(raw);
} catch {
  process.exit(0); // sin JSON válido → no interferir
}

const tool = input.tool_name || '';
const ti = input.tool_input || {};

if (tool === 'Bash') {
  const cmd = String(ti.command || '');

  // 1) Producción de Wompi en cualquier comando (p.ej. curl a production.wompi.co)
  scanProdWompi(cmd, 'un comando Bash');

  // 2) Force push
  if (/\bgit\s+push\b/.test(cmd) && /(--force\b|--force-with-lease\b|(^|\s)-f\b)/.test(cmd)) {
    block('git push --force está prohibido. Haz push normal o resuelve el conflicto sin reescribir historia.');
  }

  // 3) Nube AWS: solo lectura (describe/list/get/head/scan/lookup/search; s3 → ls/presign)
  const m = cmd.match(/\baws\s+([a-z0-9-]+)\s+([a-z0-9-]+)/i);
  if (m) {
    const service = m[1].toLowerCase();
    const op = m[2].toLowerCase();
    const readVerb = /^(describe|list|get|head|scan|lookup|search|batch-get|estimate|preview|wait)/;
    const ok = service === 's3' ? /^(ls|presign)$/.test(op) : readVerb.test(op);
    if (!ok) {
      block(
        `Comando AWS no es de solo lectura: "aws ${service} ${op}". ` +
          `Regla #7: comandos de nube READ-ONLY (describe/list/get). No mutar recursos reales.`,
      );
    }
  }

  process.exit(0);
}

if (tool === 'Write' || tool === 'Edit' || tool === 'MultiEdit') {
  scanProdWompi(JSON.stringify(ti), `una operación ${tool}`);
  process.exit(0);
}

if (tool === 'WebFetch') {
  scanProdWompi(String(ti.url || ''), 'un WebFetch');
  process.exit(0);
}

process.exit(0);
