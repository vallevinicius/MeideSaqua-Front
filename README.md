<div align="center">

# MEI de Saquá — Web

**Public portal that promotes the micro-entrepreneurs (MEIs) of Saquarema, Brazil.**

🇧🇷 [Leia em português](README.pt-BR.md)

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS--06B6D4?logo=tailwindcss&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-tested-6E9F18?logo=vitest&logoColor=white)

</div>

## About

Next.js front-end of the MEI de Saquá portal, built for the City of Saquarema. Residents find local businesses by category; owners register and manage their establishment; the city team moderates content and follows indicators in an admin area.

The API lives in [MeiDeSaqua-Back](https://github.com/vallevinicius/MeiDeSaqua-Back).

## Features

- Category pages and MEI profiles with reviews
- Account flow: sign-up, e-mail confirmation, login, password reset, e-mail change
- Establishment registration form ("Espaço MEI") and owner profile
- Admin area: approvals, active establishments, comments, courses, users and indicators dashboard
- Dynamic sitemap generated from the API

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| UI | Tailwind CSS, shadcn/ui (Radix), Ant Design, Framer Motion, Swiper |
| Forms | React Hook Form + Zod |
| Content | React Quill + DOMPurify (sanitized HTML) |
| Tests | Vitest + Testing Library |

## Architecture

```
app/          routes (public pages, account flow, admin area)
components/   page components and ui/ (Radix/shadcn base)
context/      React contexts (auth)
lib/          API clients and helpers
middleware.ts route protection (UX only; the API enforces authorization)
tests/        Vitest suites
```

## Security

- User-generated rich text is sanitized with DOMPurify before rendering
- Security headers including a Content-Security-Policy in `next.config.mjs`

## Getting started

**Prerequisites:** Node.js 18.18+, the API running locally

```bash
npm install
# create .env.local with NEXT_PUBLIC_API_URL
npm run dev        # http://localhost:3300
```
`next.config.mjs` proxies `/uploads/*` to the API, so the back-end must be running.

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the API |
| `SITEMAP_API_URL` | API URL used when building the sitemap on the server (optional) |

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server on port 3300 |
| `npm run build / npm start` | Production build and server |
| `npm test` | Vitest suite |
| `npm run lint` | ESLint |

## Testing

9 Vitest + Testing Library test files under `tests/`. Run `npm test`.

## Team

- [Vinícius Diller](https://github.com/viniciusdiller)
- Micael Robert
- [Vinicius do Valle](https://github.com/vallevinicius)
