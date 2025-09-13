# Regras – Next.js (App Router) + React 18

Aplica-se a `.jsx`, `.tsx`, `.js`, `.ts` no front.

## Componentes
- Server Components por padrão.
- Usar `"use client"` apenas quando houver estado/efeitos, eventos de UI ou acesso a `localStorage`.
- Dividir por funcionalidade; extrair componentes reutilizáveis.

## Data Fetching
- Centralizar chamadas no `app/_lib/api/client.js`.
- Para páginas públicas, considerar `revalidate` ou cache estático quando possível.
- Para rotas com sessão JWT, fazer fetch no cliente (token em `localStorage`).

## Integração com API
- Base URL: `env.NEXT_PUBLIC_API_BASE_URL`.
- Header: `Authorization: Bearer <token>`.
- Contratos: envelopes `{ <plural>, meta }` e `{ <singular> }`, erros `{ errors }`.
- Paginação: `page`/`per_page` e exibir `meta.total`.

## Tratamento de Erros
- `apiClient` lança `Error` com `.response` quando disponível.
- Superfícies de UI devem exibir mensagem curta e amigável.
- Log detalhado apenas em ambiente de desenvolvimento.

## Estilos e UI
- CSS Modules para escopo local; `styled-components` para temas/estilização dinâmica.
- Manter `globals.css` enxuto; sem CSS global pesado novo sem justificativa.

## Performance
- `next/dynamic` para componentes custosos.
- Evitar hidratação desnecessária; preferir Server Components.
- Listas grandes: paginação de servidor; virtualização quando aplicável.

## Boas Práticas
- Não duplicar lógica de HTTP fora do `apiClient`.
- Não acoplar componentes à forma interna da resposta; trabalhar com o envelope mapeado.
- Manter nomes/pastas consistentes; evitar utilitários genéricos sem uso real.

