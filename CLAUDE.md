# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page portfolio site for Andrés Felipe (a character rigger / technical artist), built with Astro 5 + Tailwind CSS 4, deployed statically to GitHub Pages. Package manager is **pnpm** (see `pnpm-lock.yaml`).

## Commands

```sh
pnpm install    # install dependencies
pnpm dev        # dev server at localhost:4321
pnpm build      # production build to ./dist/
pnpm preview    # preview the production build locally
pnpm astro check   # type-check .astro files (not wired into a script, run directly)
```

There is no test suite, linter, or CI check configured beyond the deploy workflows — there is nothing to run beyond the commands above.

## Deployment

Two GitHub Actions workflows both build and deploy to GitHub Pages on every push to `main`: `.github/workflows/deploy.yml` (uses `withastro/action`) and `.github/workflows/astro.yml` (manual npm/pnpm detection + `astro build`). They are redundant — if editing deploy behavior, check whether both are still intended to run or whether one should be removed.

## Architecture

- **Content collection (`src/content/projects/`)**: each project is a Markdown file with frontmatter validated by the Zod schema in `src/content/config.ts` (`title`, `author`, `description`, `img`, `experience`, `extra.youtube`, `extra.website`, optional `tech[]` with `name`/`logo`). The Markdown body becomes the rendered project detail content. Filenames are numerically prefixed (e.g. `006_project_everywhere.md`) purely for ordering/sorting; the slug used in URLs is derived from the filename.
- **`src/pages/index.astro`**: the entire one-page site (hero/reel, experience list, studies, skills, about), all as anchor-linked `<section>`s in one file. It calls `getCollection('projects')` and renders a card per project linking to `/project/[slug]`.
- **`src/pages/project/[id].astro`**: dynamic route generated via `getStaticPaths()` over the projects collection (SSG, one static page per project). Uses `astro:content`'s `render()` to get a `<Content />` component for the Markdown body.
- **`src/layouts/Layout.astro`**: the only layout; wraps every page, imports global CSS and Astro's `<ClientRouter />` for view transitions. Project cards/pages use `transition:name` on the image and title (e.g. `` `img-${slug}` ``, `` `title-${slug}` ``) to get animated shared-element transitions between the index list and the project detail page — keep these names in sync if changing markup on either side.
- **Images**: project/logo images referenced in frontmatter or markup (e.g. `img: edge_portada.webp`, `/logo/maya.webp`) are served from `public/` as root-relative path strings, not imported assets. There is no `src/assets/` directory — don't reintroduce Vite-imported image assets without a reason.
- **Styling**: Tailwind CSS 4 via the Vite plugin (`@tailwindcss/vite`, configured in `astro.config.mjs`), imported with `@import "tailwindcss"` in `src/styles/global.css` plus `@tailwindcss/typography` for the `prose` classes used to render Markdown project content. Styling elsewhere is inline Tailwind utility classes; there is no component library.
- **Env**: `astro.config.mjs` declares `SHOW_BUY_BUTTON` (boolean, server context) in `env.schema`, matching the value set in `.env`. Access it via `astro:env/server`, not `import.meta.env`.
