---
description: Regras consolidadas para o frontend Next.js (lafiga/front)
globs: ["app/**/*", "**/*.jsx", "**/*.tsx", "**/*.js", "**/*.ts"]
alwaysApply: true
---

# 🚀 REGRAS CONSOLIDADAS – FRONTEND (Next.js)

## 📋 CONTEXTO DO PROJETO
- **Next.js**: 14 (App Router)
- **React**: 18
- **Estilos**: CSS Modules + `styled-components`
- **HTTP**: `app/_lib/api/client.js` (fetch com Bearer JWT)
- **Env**: `env.js` com `NEXT_PUBLIC_API_BASE_URL`

## 🧭 Princípios
- Usar Server Components por padrão; Client Components apenas quando necessário (estado/efeitos/`localStorage`).
- Centralizar chamadas HTTP no `apiClient` para manter headers/erros consistentes.
- Respeitar contratos do backend (`api/.codex/rules.md`): envelopes, `meta`, e status.
- Evitar SSR para rotas que dependem de token do usuário armazenado no `localStorage`.

## 📡 Integração com API
- Base URL: `env.NEXT_PUBLIC_API_BASE_URL`.
- Autorização: header `Authorization: Bearer <token>`.
- Erros: back pode responder `{ errors: [..] }` ou `{ errors: ".." }`; converter para mensagem única.
- Paginação: `?page` e `?per_page` (limitar `per_page` ≤ 100); usar e exibir `meta.total` quando listar.

### Exemplo de uso (coleção paginada)
```js
const { characters, meta } = await apiClient.get(`/characters?page=1&per_page=25`);
```

## 🔒 Autenticação
- Token de sessão salvo em `localStorage` (chave `token`).
- No server (RSC/SSR), não assumir token do usuário; `env.API_SECRET_KEY` pode ser usado apenas para chamadas administrativas/diagnóstico em ambiente controlado (evitar para dados sensíveis do usuário).

## 🧱 Componentização e Estilos
- Colocar temas/providers globais em `app/layout.jsx`.
- Preferir CSS Modules para escopo local; `styled-components` para composições dinâmicas e tema.
- Evitar estilos globais pesados; manter `globals.css` enxuto.

## ⚙️ Data Fetching e Cache
- Páginas públicas: usar `fetch` com `revalidate` quando fizer sentido.
- Páginas dinâmicas autenticadas: `"use client"` e `apiClient`.
- Evitar duplicar caching manual; use as opções de `fetch` (`cache`, `next: { revalidate }`).

## 🧪 Qualidade e Tratamento de Erros
- Reutilizar padrões de erro do `apiClient` (lançar `Error` com `.response`).
- Exibir toasts/feedbacks consistentes (componente utilitário). 
- ESLint `next/core-web-vitals` ativo; corrigir issues óbvias.

## 📈 Performance
- Importações dinâmicas (`next/dynamic`) para componentes pesados.
- Otimizar listas grandes (paginação/virtualização) e imagens (componente `next/image` quando aplicável).

## ✅ Checklist antes de enviar
- Consumo de API segue contratos (envelopes e `meta`).
- Sem SSR dependente de `localStorage`/token do usuário.
- Mensagens de erro amigáveis e consistentes.
- Sem duplicação de lógica de chamada HTTP fora do `apiClient`.

