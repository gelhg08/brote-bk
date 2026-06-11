---
name: investigacion-paralela
description: Protocolo de la Regla #1 — investigar antes de decidir. Úsalo ANTES de cualquier decisión técnica, referencia de API, patrón de arquitectura o regla de negocio: lanza varios subagentes de investigación en paralelo (ángulos distintos), sintetiza y decide. Obligatorio antes de tocar pagos/Wompi.
---

# Investigación paralela (Regla #1)

**Cuándo:** antes de elegir una librería, un patrón, una versión, un enfoque de seguridad, o de
implementar/ajustar cualquier integración externa (sobre todo **Wompi**). Si dudas, investiga.

## Cómo

1. **Define 3–5 ángulos distintos** de la misma pregunta. Ejemplos de ángulos:
   - Documentación **oficial** vigente (la API/framework directo).
   - Mejores prácticas / “gotchas” recientes (blogs, issues, 2026).
   - Seguridad / cumplimiento (OWASP, PCI, normativa Colombia — Ley 1581).
   - Performance / escala.
   - Alternativas y trade-offs (¿por qué A y no B?).
2. **Lanza los subagentes en paralelo** (una sola tanda, varias llamadas a la vez) con el agente
   **`investigador`** (o `general-purpose` si necesitas más herramientas). Cada uno cubre **un ángulo**.
   Pide a cada agente: hechos concretos + **URL fuente** + nota de **vigencia 2026** + qué no pudo confirmar.
3. **Verifica vigencia 2026.** Descarta material viejo. Para APIs externas, manda a leer la doc oficial
   actual, no la memoria del modelo.
4. **Sintetiza tú** (el hilo principal): contrasta los informes, resuelve contradicciones y **elige según
   NUESTRO contexto** (Brote: e-commerce COP, IVA 19%, checkout invitado, NestJS+Prisma+MySQL+Wompi).
5. **Registra la decisión** en `docs/PROYECTO.md` §9 (tabla de decisiones) con fecha y motivo.

## Reglas específicas de Wompi

- **Siempre** re-verifica `docs.wompi.co` antes de tocar pagos. La firma del webhook usa
  `signature.properties` **dinámico**: nunca lo hardcodees sin confirmarlo en la doc.
- No confíes en ejemplos de internet para el orden de concatenación de la firma de integridad:
  confírmalo en la doc oficial (`reference + amount_in_cents + currency [+ expiration_time] + integrity_secret`).

## Plantilla de prompt para cada `investigador`

```
Eres investigador técnico. Investiga [TEMA] desde el ángulo [ÁNGULO].
Consulta fuentes oficiales/recientes y verifica vigencia 2026. Cita URLs.
Devuelve: hechos concretos + por qué + URL, qué cambió recientemente, y qué NO pudiste confirmar.
Contexto del proyecto: Brote, e-commerce COP (IVA 19%), checkout invitado, NestJS+Prisma+MySQL+Wompi.
No vuelques páginas enteras; sintetiza.
```

## Anti-patrones

- Decidir “de memoria” sin verificar vigencia. · Un solo ángulo. · Copiar un patrón sin adaptarlo a Brote.
- Para pagos: asumir el contrato de Wompi sin abrir la doc oficial.
