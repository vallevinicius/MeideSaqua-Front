# Mei de Saqua — Front-end

Portal de divulgação de MEIs e estabelecimentos de Saquarema. Aplicação Next.js (App Router) que consome a API do back-end do projeto.

## Stack

- Next.js 14, React 18, TypeScript
- Tailwind CSS + componentes Radix/shadcn (`components/ui`)
- Ant Design (formulários e tabelas das áreas de cadastro/admin)
- Framer Motion (animações), Swiper (carrossel), React Quill (editor de texto)

## Requisitos

- Node.js 18.18+ e npm

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3300
```

Outros scripts: `npm run build`, `npm start`, `npm run lint`.

## Variáveis de ambiente

Crie um `.env.local` na raiz (o arquivo é ignorado pelo git). Consulte o código em `lib/` e `constants/` para as variáveis usadas, principalmente a URL da API.

O `next.config.mjs` faz proxy de `/uploads/*` para o back-end em `http://localhost:3301`, então o back-end precisa estar rodando localmente.

## Estrutura

```
app/          rotas (App Router)
components/   componentes de página e `ui/` (base Radix/shadcn)
context/      contextos React
hooks/        hooks customizados
lib/          clientes de API e utilitários
types/        tipos TypeScript
public/       assets estáticos
```

## Gerenciador de pacotes

O projeto usa **npm** (`package-lock.json`). Não adicione outros lockfiles.
