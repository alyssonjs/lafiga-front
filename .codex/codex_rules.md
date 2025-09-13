---
description: Regras gerais do agente Codex CLI para o frontend (lafiga/front)
globs: ["app/**/*", "**/*.jsx", "**/*.tsx", "**/*.js", "**/*.ts", "env.js", "next.config.mjs", "public/**/*"]
alwaysApply: true
---

# 📐 Codex CLI – Regras Gerais do Frontend

## Core Rules (Sempre Aplique)
- Responder em PT‑BR; conciso, direto e amigável.
- Não inventar contratos; seguir o backend em `api/.codex/rules.md`.
- Mudanças mínimas e focadas; manter o estilo do projeto.
- Preambles curtos antes de comandos; agrupar ações relacionadas.

## Stack do Front
- Next.js 14 (App Router) + React 18.
- Estilização: CSS Modules e `styled-components`.
- Cliente HTTP: `app/_lib/api/client.js` (fetch + Bearer JWT).
- Variáveis de ambiente: `env.js` com `NEXT_PUBLIC_API_BASE_URL`.

## Contratos de API (frontend)
- Coleções: `{ <plural>: [...], meta: { page, per_page, total } }`.
- Recursos: `{ <singular>: { ... } }`.
- Erros: `{ errors: "mensagem" }` ou `{ errors: ["..."] }`.
- Paginação: `?page=1&per_page=25` (limitar `per_page` ≤ 100).
- Autorização: `Authorization: Bearer <token>` (localStorage no cliente).

## Data Fetching
- Server Components por padrão; usar `"use client"` apenas quando houver estado/efeitos ou acesso a `localStorage`.
- Em SSR para páginas públicas, usar `fetch` com `cache: 'force-cache'`/`revalidate` quando fizer sentido.
- Para rotas autenticadas, preferir Client Components (token no `localStorage`). Evitar SSR que dependa de token do usuário.
- Usar sempre `apiClient` para padronizar headers e tratamento de erros.

## Tratamento de Erros e Loading
- Padronizar toasts/feedbacks (componentes em `app/_components` quando existirem).
- Exibir estados `loading/empty/error` consistentes.
- Converter erros do backend em mensagens curtas e amigáveis.

## UI/UX
- Layouts e providers em `app/layout.jsx`.
- Componentes acessíveis; evitar acoplamento forte entre páginas.
- Preferir componentes desacoplados e reutilizáveis.

## Performance
- Code splitting por feature e `dynamic()` quando útil.
- Evitar hidratação desnecessária; medir impacto de Client Components.
- Páginas com listas grandes: paginação no servidor; considerar virtualização.

## Qualidade
- Seguir ESLint (`next/core-web-vitals`).
- Manter nomes e pastas consistentes; evitar duplicação de lógica de API.

## Integração com Backend
- Base URL via `env.NEXT_PUBLIC_API_BASE_URL`.
- Respeitar envelopes/`meta` e status HTTP definidos no backend.
- Antes de alterar contratos, mapear consumidores no front (`rg`).

## Validação
- Para endpoints principais, documentar brevemente como testar (ex.: `Characters`, `Groups`).
- Evitar novas dependências sem justificativa.

