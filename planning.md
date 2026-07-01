# Portfolio Audit — Findings & Prioritized Plan

Audit date: 2026-07-01

Scope: `astro.config.mjs`, `src/layouts/Layout.astro`, `src/pages/index.astro`,
`src/pages/project/[id].astro`, `src/styles/global.css`, `src/content/config.ts`,
all 4 project markdown files, `public/` asset sizes, both GitHub Actions workflows.

## 🔴 Critical (bugs / broken behavior)

### 1. Every page has the same `<title>` tag — the `title` prop is silently ignored
`src/layouts/Layout.astro:11` hardcodes `<title>Andres Felipe</title>`. Both `index.astro`
(`title="Andres Felipe Portfolio"`) and `[id].astro` (`title={title}`) pass a prop that's
never read. Every project page (Mindseye, Everywhere, Blades of Fire, Franceska) shows the
identical browser tab title — bad for bookmarking, SEO, and multi-tab navigation.

**Fix:** add `const { title } = Astro.props;` to Layout's frontmatter and use `<title>{title}</title>`.

### 2. Empty, unlabeled back button — screen readers announce nothing
`src/pages/project/[id].astro:27`: `<button onclick="history.back()" class="...">​</button>`
has zero text content and no `aria-label`. It's a fully invisible, unlabeled interactive control.

**Fix:** give it visible text ("← Back") or at minimum `aria-label="Go back"`.

### 3. Broken heading hierarchy
Page starts with `<h2>Andrés Felipe</h2>` (`index.astro:21`) — there's no `<h1>` until
"Experience 🦴" inside the `#projects` section (`index.astro:38`). Screen reader users
navigating by heading level land on an `<h1>` that's actually a secondary section, and the
real page title is a demoted `<h2>`.

**Fix:** make "Andrés Felipe" the single `<h1>`; demote all section titles ("Experience",
"Studies", "Skills", "About Me") to `<h2>`; sub-items stay `<h3>`.

### 4. `<main>` landmark is empty; real content sits in a bare `<div>`
`index.astro:199-203` — all sections are wrapped in `<div class="px-2...">`, then an empty
`<main></main>` sits below, doing nothing. Assistive tech users who jump to the main-content
landmark land on nothing.

**Fix:** wrap the actual content div in `<main>`, delete the vestigial empty `<main>` block.

## 🟠 High (performance)

### 5. Two new untracked GIFs total 11.3 MB and aren't referenced anywhere in `src/`
`public/IK_Collision.gif` (8.0 MB) and `public/walk_anim.gif` (3.3 MB) are sitting in
`public/` (per `git status`) but no page links to them yet. If these are meant for a new
rigging-demo section, shipping them as raw GIFs will tank load performance.

**Fix:** before wiring them in, convert to muted/looping `<video>` (`.webm`/`.mp4`,
`playsinline autoplay muted loop`) — typically 80-95% smaller than GIF — or at minimum
re-encode as paletted, frame-reduced GIFs. Lazy-load with `loading="lazy"` (video:
`preload="none"` + IntersectionObserver) since they're below the fold.

### 6. Dead, oversized image duplicates in `public/`
`char_a.png` (1.5 MB), `char_b.png` (1.5 MB), `edge_portada.png` (1.6 MB) are not referenced
anywhere in `src/` — `edge_portada.webp` (184 KB) is the one actually used. These add
~4.6 MB of dead weight to every deploy.

**Fix:** delete `char_a.png`, `char_b.png`, `edge_portada.png` (confirm before deleting).

### 7. No image optimization pipeline — plain `<img src="/...">` everywhere
Per `CLAUDE.md`, this project intentionally avoids `astro:assets`/`src/assets` imports,
which rules out Astro's built-in `<Image />` optimization. Given that constraint, the
pragmatic fix is manual:
- Add explicit `width`/`height` attributes on all `<img>` tags to prevent layout shift
  (CLS) — currently none are set anywhere (`index.astro`, `[id].astro`).
- Add `loading="lazy" decoding="async"` to below-the-fold images (project cards, studies
  logos, skills icons); keep the hero eager if there were one (there isn't — reel is just
  an iframe).
- `blades_of_fire.jpg` (532 KB) should be converted to `.webp` like its siblings.

### 8. Two redundant GitHub Actions workflows both deploy on every push
`CLAUDE.md` already flags this as known debt: `.github/workflows/deploy.yml` and
`astro.yml` both build+deploy to Pages on push to `main` — double the build minutes, and a
race/overwrite risk if they diverge.

**Fix:** pick one (recommend keeping `astro.yml` — more explicit/portable) and delete the
other.

## 🟡 Medium (SEO / correctness)

### 9. No meta description, Open Graph, or Twitter Card tags
Layout has zero `<meta name="description">` or `og:*` tags. A recruiter sharing this link
in Slack/LinkedIn gets no preview card at all.

**Fix:** add `description`/`ogImage` props to `Layout.astro`, default for index, per-project
override using each project's `description`/`img` on `[id].astro`.

### 10. `SHOW_BUY_BUTTON` env var is declared and set but never used
Declared in `astro.config.mjs`'s `env.schema` and set to `"true"` in `.env`, but never read
anywhere in `src/`. Dead config.

**Fix:** either wire it to an actual feature or remove it from both `astro.config.mjs` and
`.env`.

### 11. No `robots.txt` or sitemap
Nothing in `public/` and no `@astrojs/sitemap` integration — for a static personal-brand
site, this is small but easy SEO hygiene.

### 12. Decorative emoji embedded directly in headings
`🦴`, `🎓`, `🧠` get read aloud by screen readers ("skeleton", "graduation cap", "brain"),
interrupting the heading text.

**Fix:** wrap emoji in `<span aria-hidden="true">🦴</span>` or move to `::after` CSS content.

## 🟢 Low (polish / nice-to-have)

### 13. Leftover Astro-starter CSS on `body`
`src/styles/global.css:3-5` has `body { @apply grid place-content-center p-2; }` — vestigial
from the starter template, semantically wrong for a full-length one-page site (though
currently harmless since content isn't height-constrained). Worth removing for clarity.

### 14. No skip-to-content link for keyboard users before the nav.

### 15. `history.back()` via `onclick` + `href="#"` on the project page's image wrapper
`src/pages/project/[id].astro:29-31` — works, but a real `<a href="/">` fallback would be
more robust if a user lands on the project page directly (no history) — currently
`history.back()` with no referrer just does nothing.

### 16. `astro.config.mjs` currently shows as modified in git status
Worth reviewing that diff since it's uncommitted before building on top of it.

---

## Suggested order of attack

1. **#1–4** (bugs, ~15 min, no design risk)
2. **#6** (delete dead assets — needs confirmation first)
3. **#7–8** (perf / CI hygiene)
4. **#9–12** (SEO / a11y polish)
5. **#13–16** (cleanup)
6. Once back on a genuine design pass (hero/cards/theme), decide whether the new GIFs
   (#5) become a real "Rigging Reels" section.
