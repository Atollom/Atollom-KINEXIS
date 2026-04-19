# 📁 KINEXIS_MEMORY — Instrucciones de uso

Esta carpeta reemplaza la necesidad de subir todos los archivos del proyecto en cada sesión.

## Cómo usar

### En lugar de subir los 11 archivos, haz esto:

**Opción A — Sesión de desarrollo:**
```
Pega el contenido de CLAUDE.md + el prompt del agente específico de PROMPT_MASTER_AGENTES.md
```

**Opción B — Sesión de arquitectura / análisis:**
```
Pega el contenido de CLAUDE.md + BRECHAS_Y_PENDIENTES.md
```

**Opción C — Nueva funcionalidad:**
```
Pega CLAUDE.md + el prompt "Para diseño de nuevo módulo" de PROMPT_MASTER_AGENTES.md
```

## Contenido de la carpeta

```
KINEXIS_MEMORY/
├── CLAUDE.md                          ← MEMORIA MAESTRA (siempre incluir)
├── context/
│   └── BRECHAS_Y_PENDIENTES.md        ← Análisis completo de lo que falta
├── prompts/
│   └── PROMPT_MASTER_AGENTES.md       ← Prompts listos para cada agente
├── agents/                            ← (vacío, para agregar Specs YAML de agentes)
└── architecture/                      ← (vacío, para diagramas y decisiones)
```

## Próximos archivos a agregar

- `agents/` → Un archivo YAML por cada uno de los 42 agentes (Agent Contract)
- `architecture/decision_log.md` → Bitácora de decisiones arquitectónicas
- `architecture/prompt_master_log.md` → Log de prompts de diseño (para INDAUTOR)
