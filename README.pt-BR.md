<div align="center">

# MEI de Saquá — Web

**Portal público de divulgação dos microempreendedores (MEIs) de Saquarema.**

🇺🇸 [Read in English](README.md)

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS--06B6D4?logo=tailwindcss&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-tested-6E9F18?logo=vitest&logoColor=white)

</div>

## Sobre

Front-end Next.js do portal MEI de Saquá, feito para a Prefeitura de Saquarema. Moradores encontram negócios locais por categoria; donos cadastram e gerenciam seu estabelecimento; a equipe da prefeitura modera o conteúdo e acompanha indicadores numa área administrativa.

A API está em [MeiDeSaqua-Back](https://github.com/vallevinicius/MeiDeSaqua-Back).

## Funcionalidades

- Páginas por categoria e perfil do MEI com avaliações
- Fluxo de conta: cadastro, confirmação por e-mail, login, redefinição de senha, troca de e-mail
- Formulário de cadastro do estabelecimento ("Espaço MEI") e perfil do dono
- Área admin: aprovações, estabelecimentos ativos, comentários, cursos, usuários e painel de indicadores
- Sitemap dinâmico gerado a partir da API

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| UI | Tailwind CSS, shadcn/ui (Radix), Ant Design, Framer Motion, Swiper |
| Formulários | React Hook Form + Zod |
| Conteúdo | React Quill + DOMPurify (sanitized HTML) |
| Testes | Vitest + Testing Library |

## Arquitetura

```
app/          rotas (páginas públicas, fluxo de conta, área admin)
components/   componentes de página e ui/ (base Radix/shadcn)
context/      contextos React (auth)
lib/          clientes de API e utilitários
middleware.ts proteção de rotas (só UX; a autorização real é da API)
tests/        suítes Vitest
```

## Segurança

- Texto rico enviado por usuários é sanitizado com DOMPurify antes de renderizar
- Headers de segurança, incluindo Content-Security-Policy, em `next.config.mjs`

## Como rodar

**Pré-requisitos:** Node.js 18.18+, a API rodando localmente

```bash
npm install
# crie .env.local com NEXT_PUBLIC_API_URL
npm run dev        # http://localhost:3300
```
O `next.config.mjs` faz proxy de `/uploads/*` para a API, então o back-end precisa estar rodando.

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API |
| `SITEMAP_API_URL` | URL da API usada para gerar o sitemap no servidor (opcional) |

### Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 3300 |
| `npm run build / npm start` | Build e servidor de produção |
| `npm test` | Suíte Vitest |
| `npm run lint` | ESLint |

## Testes

9 arquivos de teste com Vitest + Testing Library em `tests/`. Rode `npm test`.

## Equipe

- [Vinícius Diller](https://github.com/viniciusdiller)
- Micael Robert
- [Vinicius do Valle](https://github.com/vallevinicius)
