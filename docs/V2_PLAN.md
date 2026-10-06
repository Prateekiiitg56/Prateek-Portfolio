# Portfolio V2: Plan and Implementation Guide

Status: plan only, nothing in this document is built yet.
Written: 1 October 2026, against the current `main` (commit `9b5a0b9`) plus the uncommitted V1.5 changes from the last working session.

This document describes what V2 of the portfolio should look like, why each change matters, and how to build it in this codebase. Every item follows the same shape:

- **Why**: the problem it fixes or the value it adds.
- **What**: the target result.
- **How**: concrete steps, file paths and code.
- **Done when**: a check you can run to call it finished.

Work through it phase by phase (section 12). Each phase can ship on its own.

---

## Contents

1. [Goals and success metrics](#1-goals-and-success-metrics)
2. [Where V1.5 stands today](#2-where-v15-stands-today)
3. [Design direction: theme, colour, type, motion](#3-design-direction)
4. [Information architecture and component placement](#4-information-architecture-and-component-placement)
5. [Projects: the /work page and case studies](#5-projects-the-work-page-and-case-studies)
6. [3D hero V2](#6-3d-hero-v2)
7. [Engineering foundation](#7-engineering-foundation)
8. [Performance](#8-performance)
9. [Accessibility](#9-accessibility)
10. [SEO and sharing](#10-seo-and-sharing)
11. [Security and API](#11-security-and-api)
12. [Testing and CI](#12-testing-and-ci)
13. [Roadmap](#13-roadmap)
14. [Decisions needed from you](#14-decisions-needed-from-you)
15. [Appendix A: avatar generation prompt](#appendix-a-avatar-generation-prompt)
16. [Appendix B: file change map](#appendix-b-file-change-map)

---

## 1. Goals and success metrics

### Goals

1. **Tell a clear story.** A visitor should understand who you are, what you build and why it matters within one scroll, then be able to dig into any project in depth.
2. **Look current and professional.** One confident colour system, editorial typography, motion that explains things instead of decorating them.
3. **Make the work the hero.** Real screenshots, short taglines, outcomes, and a proper case-study page per project.
4. **Fast everywhere.** The 3D scene is a desktop enhancement, never a cost paid by phone users.
5. **Accessible and shareable.** Keyboard and screen-reader friendly, readable contrast, deep links and link previews for every project.

### Non-goals for V2

- Moving to a different framework (Next.js, Astro). The current React + Vite + GSAP stack is fine; V2 is a redesign and a cleanup, not a rewrite.
- A CMS. Content stays in typed files in the repo.

### Success metrics

| Metric | V1.5 (estimate) | V2 target | How to measure |
|---|---|---|---|
| Lighthouse Performance, mobile | not measured (build fails locally) | 90 or higher | Lighthouse CI on every PR |
| Largest Contentful Paint, mobile 4G | about 3 to 4 s (loader blocks) | 2.0 s or less | Lighthouse, Vercel Speed Insights |
| Cumulative Layout Shift | unknown | 0.05 or less | Lighthouse, Speed Insights |
| Interaction to Next Paint | unknown | 200 ms or less | Speed Insights (real users) |
| Initial JS on mobile (gzip) | not measured | 170 KB or less | `rollup-plugin-visualizer` |
| Lighthouse Accessibility | not measured | 100 | Lighthouse CI + axe |
| Time to first project screenshot from home | about 4 screens of scroll | 2 screens | manual |
| Every project has a shareable URL | no | yes | `/work/:slug` exists for all |

---

## 2. Where V1.5 stands today

An honest audit, so V2 fixes root causes instead of symptoms.

| Area | Finding | Evidence | V2 action |
|---|---|---|---|
| Build | `npm run build` uses `NODE_OPTIONS=... tsc -b && vite build`. That syntax fails in Windows `cmd`, and terser minification needs a lot of memory (the last local build ran out of memory). | `package.json`, `vite.config.ts` | Section 7.6 |
| Animation stack | Two animation libraries (GSAP and anime.js) doing the same jobs, plus CSS keyframes. | `Work.tsx`, `TechStackNew.tsx`, `Career.tsx`, `WhatIDo.tsx`, `Contact.tsx`, `CallToAction.tsx` | Consolidate on GSAP (7.4) |
| Scroll smoothness | Lenis runs its own `requestAnimationFrame` loop, separate from GSAP's ticker, so scrubbed timelines can lag a frame behind the scroll. | `Navbar.tsx` | Drive Lenis from `gsap.ticker` (7.4) |
| Layout | Fixed pixel container widths (1300, 1200, 900, 500 px) and z-index values up to `9999999999`. | `App.css`, `Loading.css` | Fluid container, z-index scale (3.4) |
| Contrast | "What I do" card subtitles use white at 30% opacity: contrast about 2.6:1, below the 4.5:1 minimum. Play page text at 40% white: 3.8:1. | `WhatIDo.css` line 92, `Play.css` | Token-based text colours (3.2) |
| Small text | 9 to 11 px labels in several places. | `Story.css`, `TechStackNew.css`, `ProjectModal.css`, `Navbar.css`, `MyWorks.css`, `Play.css` | 12 px minimum for labels, 16 px for body |
| Text selection | `user-select: none` on `:root`, so nobody can copy your email or any text. | `index.css` | Remove |
| Headings | `h2` "Hello! I'm" comes before the page `h1`; section titles mix `h2`, `h3`, `h4`. | `Landing.tsx`, `About.tsx` | One `h1`, one `h2` per chapter (9) |
| Toolbox | The pyramid has 42 icons, 13 of them duplicates (React, Next.js, Git, Firebase and others appear twice). Tools you actually ship with (TypeScript, Three.js, GSAP, Supabase, MongoDB, FastAPI, PyTorch, n8n, Playwright) are missing. Icons load from a third-party CDN. | `TechStackNew.tsx` | Data-driven toolbox (4.3, chapter 05) |
| Work section | Horizontal pinned scroll through 8 cards: long scroll distance, hard for keyboard users, heavy on low-end devices. The first four cards are near-identical 3D landing pages with stock images. | `Work.tsx`, `config.ts` | Stacked featured cards + curation (5.9) |
| Project data | Long titles ("UiUxDesigner - Enterprise AI Design System Extraction & Prompt Synthesis"), paragraph-length descriptions in cards, no year, status, role or outcome. Project facts are duplicated in the chat system prompt and will drift. | `config.ts`, `Play.tsx` | Typed content model (5.2) |
| Projects page | Hover-driven "Currently exploring" block swaps content while the mouse moves (distracting, shifts layout). Cards are `div role="button"`, not links. No URL per project, filters not in the URL. | `MyWorks.tsx` | Section 5 |
| SEO | Single-page app: crawlers and link previews see the same empty shell and one title for every route. | `index.html`, `vercel.json` | Meta prerender (10) |
| Chat API | `/api/chat` forwards any `messages` array, including any system prompt, to Groq with your key. Anyone can use it as a free LLM endpoint. The system prompt lives in client code. | `api/chat.js`, `Play.tsx` | Harden (11.1) |
| 3D model | The character is AES-encrypted and decrypted in the browser with a password that ships in the JS bundle. It only deters casual downloads and costs CPU time on load. | `Character/utils/decrypt.ts` | Plain optimised GLB in V2 (6) |
| Loader | Progress is simulated with random increments, and every visit waits for it. | `Loading.tsx` | Real progress, skip on repeat visits (4.4) |
| Mobile hero | Phones show a static photo instead of the character. | `Landing.tsx`, `Landing.css` | Rendered avatar poster (6.5) |
| Icons | Four icon families mixed (`fa6`, `md`, `tb`, `fi`). | several components | One icon set (3.6) |
| Types | `project: any` in several components. | `ProjectModal.tsx`, `MyWorks.tsx`, `Work.tsx` | Typed content (5.2) |

### Keep from V1.5

These parts work and carry into V2:

- The cursor-following head on the 3D character, and the hover see-through effect with the speech bubble.
- The shared-element project modal (thumbnail flies into the modal and back). It becomes the "quick view" in V2.
- The chapter idea and the side progress rail.
- The optimised image set in `public/images/opt/`.
- The loader hand-off fix (stale progress timer stopped on unmount).

---

## 3. Design direction

### 3.1 Concept: "Night Shift Studio"

The site reads like a short story told in chapters by someone who builds things late into the night. Editorial typography sets the tone, one signal colour (cyan) carries meaning, and depth comes from light and shadow instead of neon gradients.

Principles:

1. **One accent with a job.** Cyan marks things you can act on and the current chapter. Violet is a supporting tone for decoration only. Magenta is retired as a UI colour.
2. **Big type, few words.** Headlines are short and large. Body copy stays under 70 characters per line.
3. **Motion explains.** Every animation answers "where did this come from" or "where am I in the story".
4. **Work first.** Screenshots are large and sharp; chrome around them is quiet.
5. **Two themes, one design.** Dark is the default, a light "Paper" theme is one click away and designed with equal care.

### 3.2 Colour system

All values below were checked with the WCAG 2 contrast formula. "AA body" means 4.5:1 or higher.

**Dark theme ("Signal")**

| Token | Hex | Use | Contrast on `--bg` |
|---|---|---|---|
| `--bg` | `#07090E` | page background | |
| `--bg-raised` | `#0E121B` | sections, cards | |
| `--surface-2` | `#151B28` | nested surfaces, inputs | |
| `--border` | `#2A3245` | decorative dividers | 1.6:1 (decorative only) |
| `--border-strong` | `#56627A` | input borders, focusable outlines | 3.3:1 (meets 3:1 for UI parts) |
| `--text` | `#EDF1F7` | headings, body | 17.6:1 |
| `--text-2` | `#A9B3C4` | secondary body | 9.4:1 |
| `--text-3` | `#8590A3` | meta, captions | 6.2:1 |
| `--accent` | `#5CE1FF` | links, primary CTA, focus ring, active chapter | 13.0:1 |
| `--on-accent` | `#04121A` | text on cyan buttons | 12.4:1 on `--accent` |
| `--accent-2` | `#A196FF` | decorative highlights, chapter tint | 7.9:1 |
| `--success` | `#4ADE80` | "Live" status | 11.4:1 |
| `--warning` | `#FBBF24` | "In progress" status | 11.9:1 |
| `--danger` | `#FF7A7A` | errors | 7.9:1 |

**Light theme ("Paper")**

| Token | Hex | Contrast on `--bg` / on `--surface-2` |
|---|---|---|
| `--bg` | `#F6F7FA` | |
| `--bg-raised` | `#FFFFFF` | |
| `--surface-2` | `#ECEFF5` | |
| `--border` | `#CDD3DE` | decorative only |
| `--border-strong` | `#7D8799` | 3.4:1 |
| `--text` | `#0B0F17` | 17.9:1 / 16.7:1 |
| `--text-2` | `#485264` | 7.4:1 / 6.8:1 |
| `--text-3` | `#5F6A7D` | 5.1:1 / 4.7:1 |
| `--accent` | `#006B8F` | 5.6:1 / 5.2:1 (white text on it: 6.0:1) |
| `--accent-2` | `#5A48D6` | 5.9:1 / 5.5:1 |
| `--success` | `#0E7A3A` | 4.7:1 on `--surface-2` |
| `--warning` | `#A15C00` | 4.8:1 / 4.5:1 |
| `--danger` | `#C2323A` | 5.1:1 / 4.8:1 |

**Rules**

- Components never use raw hex values. They use semantic tokens (`--text-2`, `--accent`), never primitives.
- Status is never shown by colour alone: "Live" has a dot and the word.
- Text opacity tricks (`rgba(255,255,255,0.3)`) are banned; use `--text-2` or `--text-3`.
- Gradients appear in three places only: the hero glow, the chapter tint (3.5) and the rail progress line.

**How**

Create `src/design/tokens.css`. Use `light-dark()` so each semantic token is defined once (supported in all current browsers since 2024):

```css
/* src/design/tokens.css */
:root {
  color-scheme: dark;
  /* primitives */
  --ink-950: #07090e; --ink-900: #0e121b; --ink-850: #151b28;
  --ink-700: #2a3245; --ink-500: #56627a; --ink-400: #8590a3;
  --ink-300: #a9b3c4; --ink-100: #edf1f7;
  --paper-50: #f6f7fa; --paper-0: #ffffff; --paper-100: #eceff5;
  --paper-300: #cdd3de; --paper-500: #7d8799; --paper-600: #5f6a7d;
  --paper-700: #485264; --paper-950: #0b0f17;
  --cyan-300: #5ce1ff; --cyan-700: #006b8f;
  --violet-300: #a196ff; --violet-700: #5a48d6;

  /* semantic tokens: light value first, dark value second */
  --bg: light-dark(var(--paper-50), var(--ink-950));
  --bg-raised: light-dark(var(--paper-0), var(--ink-900));
  --surface-2: light-dark(var(--paper-100), var(--ink-850));
  --border: light-dark(var(--paper-300), var(--ink-700));
  --border-strong: light-dark(var(--paper-500), var(--ink-500));
  --text: light-dark(var(--paper-950), var(--ink-100));
  --text-2: light-dark(var(--paper-700), var(--ink-300));
  --text-3: light-dark(var(--paper-600), var(--ink-400));
  --accent: light-dark(var(--cyan-700), var(--cyan-300));
  --on-accent: light-dark(#ffffff, #04121a);
  --accent-2: light-dark(var(--violet-700), var(--violet-300));
  --focus-ring: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }
```

Then replace the current `--accentColor`, `--accentSecondary`, `--accentTertiary`, `--backgroundColor`, `--surfaceColor`, `--textColor`, `--mutedColor` in `src/index.css` with the new names, and search-and-replace their uses in every CSS file. Keep the old names as aliases for one release to avoid a big-bang change:

```css
:root { --accentColor: var(--accent); --textColor: var(--text); /* and so on */ }
```

**Theme toggle without a flash**

Add this inline script at the top of `<head>` in `index.html`, so the theme is set before the first paint:

```html
<script>
  (function () {
    var t;
    try { t = localStorage.getItem("theme"); } catch (e) {}
    if (!t) t = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.dataset.theme = t;
  })();
</script>
```

The toggle button reveals the new theme as a growing circle from the button, using the View Transitions API, and falls back to an instant switch:

```ts
// src/app/theme.ts
export function toggleTheme(e: React.MouseEvent) {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  const apply = () => {
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) return apply();

  const { clientX: x, clientY: y } = e;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => {
    root.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 520, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: "::view-transition-new(root)" }
    );
  });
}
```

```css
::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
```

The 3D scene listens for the theme change (a `MutationObserver` on `data-theme`) and tweens its light colours and intensities, so the character never looks pasted onto the page.

**Done when**: no raw hex values remain in component CSS (`grep -rnE "#[0-9a-fA-F]{3,6}" src/components src/sections src/pages` only finds tokens files), and both themes pass axe colour-contrast checks.

### 3.3 Typography

| Role | Font | Notes |
|---|---|---|
| UI and body | **Geist** (variable, 300 to 800) | Already in use, keeps continuity. |
| Labels, chapter tags, meta, numbers | **Geist Mono** | Gives the "developer" voice to small text; tabular numbers for dates. |
| Accent words in headlines | **Instrument Serif Italic** | One or two words per headline only, for example "I build *useful* AI products". |

Fallback pairing if you prefer an all-sans look: Space Grotesk (headings) with DM Sans (body).

**Fluid type scale** (one set of tokens, no per-breakpoint font sizes):

```css
--step--1: clamp(0.83rem, 0.80rem + 0.15vw, 0.90rem); /* labels, 13 to 14 px */
--step-0:  clamp(1.00rem, 0.96rem + 0.20vw, 1.13rem); /* body, 16 to 18 px */
--step-1:  clamp(1.20rem, 1.10rem + 0.45vw, 1.50rem);
--step-2:  clamp(1.44rem, 1.25rem + 0.90vw, 2.00rem);
--step-3:  clamp(1.73rem, 1.40rem + 1.60vw, 2.75rem); /* section titles */
--step-4:  clamp(2.07rem, 1.50rem + 2.80vw, 3.75rem);
--step-5:  clamp(2.49rem, 1.60rem + 4.40vw, 5.25rem); /* chapter headlines */
--step-6:  clamp(3.00rem, 1.60rem + 7.00vw, 8.00rem); /* hero */
```

Rules: body line-height 1.6, headings 1.05 to 1.15 with letter-spacing `-0.02em` at `--step-4` and above, `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs, `font-variant-numeric: tabular-nums` on dates and counters, minimum 12 px for any text.

**How**: self-host the fonts. Download the variable `woff2` files (Geist and Geist Mono from the official `vercel/geist-font` release, Instrument Serif Italic from Google Fonts) into `public/fonts/`, declare them in `src/design/fonts.css` with `font-display: swap`, and preload only the Geist variable file:

```html
<link rel="preload" href="/fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossorigin />
```

Remove the Google Fonts `<link>` tags from `index.html`. This removes two third-party connections from the critical path.

### 3.4 Space, radius, elevation, layers

```css
/* 4 px base spacing */
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
--space-9: 96px; --space-10: 128px;
--section-y: clamp(96px, 14vh, 176px);

/* layout */
--gutter: clamp(16px, 4vw, 48px);
--container: min(1240px, 100% - 2 * var(--gutter));
--container-narrow: min(720px, 100% - 2 * var(--gutter));

/* radius */
--radius-sm: 8px; --radius-md: 14px; --radius-lg: 22px; --radius-pill: 999px;

/* elevation (dark theme values; light theme uses softer shadows) */
--shadow-1: 0 1px 2px rgb(0 0 0 / .3);
--shadow-2: 0 8px 24px rgb(0 0 0 / .35);
--shadow-3: 0 24px 60px rgb(0 0 0 / .45);
--glow-accent: 0 0 0 1px color-mix(in oklab, var(--accent) 35%, transparent),
               0 10px 40px color-mix(in oklab, var(--accent) 18%, transparent);

/* z-index scale: replaces values like 9999999999 */
--z-base: 0; --z-raised: 10; --z-scene: 20; --z-sticky: 100; --z-nav: 200;
--z-cursor: 300; --z-overlay: 900; --z-modal: 1000; --z-toast: 1100; --z-loader: 2000;
```

Breakpoints: 480, 768, 1024, 1280, 1600. Prefer container queries (`@container`) for cards so a card looks right wherever it is placed.

**How**: replace `.section-container` width rules in `App.css` with `width: var(--container); margin-inline: auto;` and replace every `z-index` literal with a token.

### 3.5 Motion language

**Tokens**

| Token | Value | Use |
|---|---|---|
| `--dur-1` | 120 ms | press feedback, colour changes |
| `--dur-2` | 200 ms | hover states, small toggles |
| `--dur-3` | 320 ms | menus, chips, toasts |
| `--dur-4` | 560 ms | modals, card transitions |
| `--dur-5` | 900 ms | headline reveals, chapter changes |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` (GSAP `expo.out`) | things arriving |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` (GSAP `power3.inOut`) | things moving across the screen |
| `--ease-in` | `cubic-bezier(.55,0,1,.45)` (GSAP `power2.in`) | things leaving |

Mirror these in `src/motion/presets.ts` so GSAP code uses the same values.

**Rules**

1. Exits run at about 65% of the enter duration.
2. Stagger lists by 30 to 50 ms per item, never more than 600 ms in total.
3. Animate only `transform`, `opacity`, `clip-path` and CSS variables.
4. No content stays invisible for more than 300 ms after it enters the viewport.
5. Animations can be interrupted: a new state kills the old tween (`overwrite: "auto"`).
6. With `prefers-reduced-motion: reduce`, show every element in its final state, disable scrub, parallax and the loader, and keep only opacity fades.

**Signature moves** (the six things people will remember):

1. **Masked line reveal** for headlines (GSAP SplitText with `mask: "lines"`).
2. **Chapter tint**: the background glow shifts hue as you enter each chapter, and the rail updates.
3. **Character story**: the 3D character turns, opens the monitor and leaves as chapters change (section 6).
4. **Stacking project cards** in Selected Work.
5. **Shared-element transition** from a project card to its case-study page.
6. **Contextual cursor**: the cursor grows and shows a label ("View", "Open", "Copy") over interactive targets.

Chapter tint implementation:

```ts
// inside the Chapter component (section 4.4)
ScrollTrigger.create({
  trigger: el,
  start: "top 60%",
  end: "bottom 60%",
  onToggle: (self) =>
    self.isActive && gsap.to(document.documentElement, { "--chapter-glow": tint, duration: 0.9, ease: "power2.out" }),
});
```

```css
body {
  background:
    radial-gradient(60% 50% at 75% 10%, color-mix(in oklab, var(--chapter-glow) 18%, transparent), transparent 70%),
    var(--bg);
}
```

### 3.6 Icons and imagery

- **One icon set**: Phosphor (`@phosphor-icons/react`), regular weight in UI, duotone only for capability cards. Replace all `react-icons` imports, then remove `react-icons`.
- **Tech logos**: official SVGs from Simple Icons, copied into `public/icons/tech/` (no CDN calls, consistent size and colour).
- **Project imagery**: real screenshots captured automatically (5.3), 16:10 aspect ratio, same browser frame style.
- **Your photo**: duotone treatment in the brand colours on the About chapter (CSS `mix-blend-mode` over a gradient, or pre-processed with `sharp`).

---

## 4. Information architecture and component placement

### 4.1 Routes

| Route | Page | Notes |
|---|---|---|
| `/` | Home (the story) | |
| `/work` | All projects | replaces `/myworks`; add a redirect |
| `/work/:slug` | Case study | new |
| `/play` | Chess + AI chat | kept, restyled with tokens |
| `/resume` | HTML resume with print styles | optional, links to the PDF |
| `*` | 404 | themed, links back to chapters |

Redirect in `vercel.json` (keeps old links alive):

```json
{ "redirects": [{ "source": "/myworks", "destination": "/work", "permanent": true }] }
```

### 4.2 Home page story

| # | Chapter | Purpose | Main content | Signature motion |
|---|---|---|---|---|
| Prologue | Hello | Who you are in 5 seconds | Name, one-line value proposition, 2 CTAs, availability, 3D character | Headline mask reveal, character waves |
| Proof strip | (inside the hero) | Instant credibility | "21 projects shipped · GSSoC · Hacktoberfest · CodSoft AI intern · Open source contributor" | Slow marquee, pauses on hover and focus |
| 01 | Who I am | Personality and background | Short bio, photo, quick facts, "Currently" card | Character turns toward the text |
| 02 | What I do | Capabilities | Bento grid of 4 capability cards | Monitor rises and plays project footage |
| 03 | Selected work | Best 5 to 6 projects | Stacking full-width project cards | Cards stack and dim as you scroll |
| 04 | The journey | Experience and growth | Timeline: experience, open source, education, achievements | Line draws with scroll |
| 05 | Toolbox | Skills with evidence | Grouped tool chips with "used in N projects" | Chips stagger in |
| 06 | Playground | Fun and curiosity | Chess vs your engine, AI chat, 3D experiments | Cards tilt on hover |
| Epilogue | Let's talk | Conversion | Big CTA, copy email, contact form, socials, local time | Magnetic primary button |
| | Footer | Navigation and credits | Links, socials, "last updated", source link | none |

### 4.3 Desktop wireframe (1440 px)

```
+--------------------------------------------------------------------------+
| P.S.                  About  Work  Journey  Contact   [Ctrl K] [theme] [Resume] |  floating pill nav
+--------------------------------------------------------------------------+
|                                                                          |
|  PRATEEK SINGH . FULL-STACK & AI                    .-----------.        |
|                                                     |  3D       |        |
|  I build *useful* AI                                |  character|        |
|  products for the web.                              |  at desk  |        |
|                                                     '-----------'        |
|  [ View selected work ]  ( Download resume )                             |
|  (o) Open to internships . India . 21:42 IST                       [rail]|
|  ----------------------------------------------------------------------  |
|  21 projects . GSSoC . Hacktoberfest . CodSoft AI intern . OSS  >>>      |  proof strip
+--------------------------------------------------------------------------+
|  CHAPTER 01 . WHO I AM                                                   |
|  [character turned]        Short bio (3 sentences)                        |
|                            +-----------+-----------+-----------+         |
|                            | Studying  | Based in  | Focus     |         |
|                            +-----------+-----------+-----------+         |
|                            [ Currently: building X, learning Y ]          |
+--------------------------------------------------------------------------+
|  CHAPTER 02 . WHAT I DO                                                  |
|  [character at desk,       +-------------------+---------+               |
|   monitor shows            | Full-stack web    | AI and  |               |
|   project footage]         | (large)           | ML      |               |
|                            +---------+---------+---------+               |
|                            | 3D web  | Automation        |               |
|                            +---------+-------------------+               |
+--------------------------------------------------------------------------+
|  CHAPTER 03 . SELECTED WORK                                              |
|  +--------------------------------------------------------------------+  |
|  | [ large screenshot ]                 01  Project name               |  |
|  |                                      one-line outcome               |  |
|  |                                      stack chips   [Case study ->]  |  |
|  +--------------------------------------------------------------------+  |
|    (next card slides over this one while it scales to 0.92 and dims)     |
|                       [ Explore all 21 projects -> ]                     |
+--------------------------------------------------------------------------+
|  CHAPTER 04 . THE JOURNEY        timeline (year | role | outcomes | proof)|
|  CHAPTER 05 . TOOLBOX            grouped chips, "used in N projects"     |
|  CHAPTER 06 . PLAYGROUND         [ Chess ] [ Ask my AI ] [ 3D lab ]      |
|  EPILOGUE . LET'S TALK           Big headline, [Copy email] form, socials |
|  FOOTER                                                                  |
+--------------------------------------------------------------------------+
```

Mobile (390 px): the nav collapses to a logo plus a menu button; the hero stacks eyebrow, headline, CTAs, then the avatar poster; bento cards become a single column; stacked project cards become a plain vertical list (no pinning or sticky effects); the rail is hidden and a thin progress bar sits under the top bar.

### 4.4 Global components

**Navigation (`src/components/layout/Nav.tsx`)**

- Why: the current header puts the email in the centre, overlapping the links at some widths, and the resume link appears in three places.
- What: a floating pill nav, centred, glass background (`backdrop-filter: blur(12px)` over `--bg-raised` at 70%). Links: About, Work, Journey, Contact. Right side: command palette button, theme toggle, Resume (the only resume link outside the footer). The active chapter gets a sliding highlight.
- How: compute the active chapter from the chapter registry (below). Move the highlight with GSAP Flip (`Flip.getState` then `Flip.from`) or a CSS transform on a single indicator element. Hide the nav on scroll down and show it on scroll up (`ScrollTrigger.create({ onUpdate: self => nav.classList.toggle("is-hidden", self.direction === 1) })`).
- Remove: `navbar-connect` (email in the header), the fixed bottom-right `RESUME` link in `SocialIcons.tsx`.

**Mobile menu**: full-screen overlay, links stagger in, focus trapped inside, `Escape` closes, body scroll locked through Lenis (`lenis.stop()`).

**Chapter component and registry (`src/components/layout/Chapter.tsx`)**

- Why: chapters are currently hard-coded twice (CSS selectors in `StoryProgress.tsx` and `ChapterTag` indexes in each section).
- What: one wrapper that renders the section landmark, the chapter tag, the heading, registers itself for the rail, the nav and the command palette, and drives the chapter tint.

```tsx
<Chapter id="about" index={1} title="Who I am" tint="var(--accent-2)">
  <About />
</Chapter>
```

```tsx
// sketch
export function Chapter({ id, index, title, tint, children }: ChapterProps) {
  const ref = useRef<HTMLElement>(null);
  const { register } = useChapters();
  useEffect(() => register({ id, index, title, el: ref.current! }), [id, index, title]);
  useGSAP(() => { /* chapter tint trigger from 3.5 */ }, { scope: ref });
  return (
    <section id={id} ref={ref} aria-labelledby={`${id}-title`} className={styles.chapter}>
      <p className={styles.tag}>{index === 0 ? "Prologue" : `Chapter ${String(index).padStart(2, "0")}`} · {title}</p>
      {children}
    </section>
  );
}
```

**Story rail**: keep the current design, read chapters from the registry, enlarge the hit area of each dot to 24 by 24 px (WCAG 2.2 target size), hide on screens under 1025 px.

**Command palette (Ctrl K / Cmd K)**

- Why: fast navigation for recruiters and developers, and a signature "developer" feature.
- What: groups "Go to" (chapters, pages), "Projects" (fuzzy search by title, tag, tool), "Actions" (copy email, open resume, toggle theme, toggle reduced motion, view source).
- How: `cmdk` library, lazy-loaded on the first `Ctrl K` press or button click:

```tsx
const Palette = lazy(() => import("./CommandPalette"));
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
  };
  addEventListener("keydown", onKey);
  return () => removeEventListener("keydown", onKey);
}, []);
```

**Cursor**: keep the follower, add labels. Elements opt in with `data-cursor="view"` and `data-cursor-label="View"`. Disabled on touch devices and with reduced motion. Never hides the native cursor.

**Toasts**: one `aria-live="polite"` region for "Email copied", form results and errors. Auto-dismiss after 4 s.

**Loader**

- Why: every visit waits through a simulated progress bar and a "Welcome" morph.
- What: real progress from asset loading, a short name animation, under 1.2 s when assets are cached, skipped completely on repeat visits in the same session and with reduced motion. On phones there is no 3D to wait for, so there is no loader at all.
- How: track real bytes with `THREE.LoadingManager` plus a streamed `fetch` for the model (read `Content-Length`, count chunks from `response.body.getReader()`). Store `sessionStorage.setItem("intro-seen", "1")` after the first run.

**Footer**: sitemap links, socials, "Designed and built by Prateek Singh", last updated date (build time injected with `define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString()) }` in `vite.config.ts`), link to the source on GitHub.

### 4.5 Section specs

**Prologue: Hero (`src/sections/Hero.tsx`)**

- Eyebrow in Geist Mono: `PRATEEK SINGH · FULL-STACK & AI DEVELOPER`.
- `h1`: one sentence with one serif accent word, for example "I build *useful* AI products for the web." Keep the rotating roles out of the `h1`; if you want them, put them in a small line under the headline.
- Supporting line: one sentence about what you are doing now.
- CTAs: primary "View selected work" (scrolls to chapter 03), secondary "Download resume".
- Availability pill: green dot, "Open to internships", location, live local time (`Intl.DateTimeFormat` with `timeZone: "Asia/Kolkata"`, updated every minute).
- 3D character on the right half on desktop (section 6); poster image on mobile.
- Proof strip along the bottom edge: CSS marquee (`@keyframes` translating a duplicated list), paused on hover and focus, static under reduced motion. This replaces `react-fast-marquee`.

**Chapter 01: Who I am (`src/sections/About.tsx`)**

- Left: the character (desktop) or a duotone photo (mobile).
- Right: bio in three short sentences, a 3-column facts grid (Studying, Based in, Focus), and a "Currently" card fed from `src/content/now.ts` (building, learning, reading) with an "Updated Sep 2026" stamp.
- Motion: masked line reveal for the bio, facts fade up with a 40 ms stagger.

**Chapter 02: What I do (`src/sections/Capabilities.tsx`)**

- Replace the two expandable cards with a bento grid of four cards: Full-stack web, AI and ML, Creative 3D web, Automation (n8n, scrapers, agents).
- Each card: duotone icon, one-line promise, 4 to 6 tool chips, link "See related projects" to `/work?cat=ai` (deep link into the filtered list).
- Hover: cursor spotlight inside the card (radial gradient positioned with CSS variables `--mx`, `--my` set on `pointermove`), border brightens to `--accent`.
- The `.what-box-in` display toggling in `GsapScroll.ts` goes away; the grid is always in the DOM.

**Chapter 03: Selected work (`src/sections/SelectedWork.tsx`)**

- Why replace the horizontal pin: long scroll distance, horizontal content is awkward for keyboard and screen-reader users, and pinning plus a transformed track is the most expensive thing on the page.
- What: 5 or 6 featured projects (curation in 5.9), each a full-width card: screenshot on one side, number, title, one-line outcome, stack chips, "Case study" link and a "Quick view" button (opens the existing shared-element modal).
- How: CSS `position: sticky` stacking with a scrubbed scale, no pinning:

```css
.stack-card { position: sticky; top: calc(96px + var(--i) * 12px); }
```

```ts
const cards = gsap.utils.toArray<HTMLElement>(".stack-card");
cards.forEach((card, i) => {
  const next = cards[i + 1];
  if (!next) return;
  gsap.to(card, {
    scale: 0.92, opacity: 0.45, ease: "none",
    scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=96", scrub: true },
  });
});
```

- Mobile: plain vertical list, no sticky, no scrub.
- End with "Explore all 21 projects" linking to `/work`.

**Chapter 04: The journey (`src/sections/Journey.tsx`)**

- One timeline for experience, open source programmes, education and achievements, newest first.
- Each entry: logo, role, organisation, dates, two outcome bullets ("Merged 12 PRs across 4 repos", "Built X used by Y"), proof links (certificate, reference letter, PR list).
- Keep the scroll-drawn line from `setAllTimeline`, rebuilt with `useGSAP`.

**Chapter 05: Toolbox (`src/sections/Toolbox.tsx`)**

- Replace the pyramid and its background video.
- Groups: Languages, Frontend, Backend and data, AI and ML, Tooling and DevOps.
- Each chip: logo, name, and "used in N projects", computed from project data, so the toolbox can never drift from the work. Clicking a chip opens `/work?tech=<id>`.

```ts
// src/content/tools.ts
export const tools = {
  react: { name: "React", group: "frontend", icon: "/icons/tech/react.svg" },
  threejs: { name: "Three.js", group: "frontend", icon: "/icons/tech/threedotjs.svg" },
  n8n: { name: "n8n", group: "tooling", icon: "/icons/tech/n8n.svg" },
  // ...
} as const satisfies Record<string, Tool>;

export const usage = (id: keyof typeof tools) => projects.filter((p) => p.stack.includes(id)).length;
```

**Chapter 06: Playground (`src/sections/Playground.tsx`)**

- Three cards: "Play chess against my engine" (`/play`), "Ask my AI about my work" (opens the chat panel), "3D lab" (the four 3D landing pages as one series).
- Replaces `CallToAction.tsx`. "Hire me" moves to the Epilogue.

**Epilogue: Let's talk (`src/sections/Contact.tsx`)**

- Headline with serif accent, for example "Have an idea? *Let's build it.*"
- Email shown in full with a "Copy" button (toast "Email copied") and a `mailto:` link.
- Contact form: name, email, message, hidden honeypot field; posts to `/api/contact` (11.2); inline validation on blur, loading state on the button, success and error messages in the live region.
- Socials, availability, local time.
- Magnetic primary button (GSAP `quickTo`, pull strength 0.3, max one magnetic element per screen).

---

## 5. Projects: the /work page and case studies

### 5.1 Problems today

- No URL per project, so nothing can be shared or indexed.
- Cards are `div role="button"` that open a modal; there is nowhere to tell the story of a project.
- Filters come from the first segment of free-text categories, which creates uneven buckets ("B2B Automation", "Browser Extension", "Web App").
- The featured block changes on hover, which moves content under the cursor.
- Four of the first five projects are near-identical 3D landing pages with stock images.

### 5.2 Content model

Move project data out of `src/config.ts` into `src/content/projects.ts` with a real type:

```ts
// src/content/types.ts
export type ProjectCategory = "ai" | "fullstack" | "3d" | "automation" | "ml" | "tooling";
export type ProjectStatus = "live" | "in-progress" | "archived";

export interface Project {
  slug: string;              // url segment, for example "ui-ux-designer"
  title: string;             // short: "UiUxDesigner"
  tagline: string;           // 90 characters max: what it does for whom
  year: number;
  status: ProjectStatus;
  categories: ProjectCategory[];
  stack: (keyof typeof tools)[];   // canonical tool ids, drives filters and the toolbox
  role: string;              // "Solo: design, frontend, AI pipeline"
  featured?: number;         // position on the home page, lower first
  cover: string;             // /images/projects/<slug>/cover (no extension, see 8.3)
  gallery?: string[];
  video?: string;            // short muted loop for hover previews
  accent?: string;           // per-project glow colour
  links: { repo?: string; live?: string; demoVideo?: string };
  metrics?: { label: string; value: string }[];
  hasCaseStudy?: boolean;    // true when src/content/case-studies/<slug>.mdx exists
}
```

```ts
// src/content/projects.ts
export const projects = [
  {
    slug: "ui-ux-designer",
    title: "UiUxDesigner",
    tagline: "Extracts a full design system from any URL, screenshot or video and turns it into build-ready prompts.",
    year: 2026,
    status: "live",
    categories: ["ai", "tooling"],
    stack: ["nextjs", "react", "tailwind", "playwright", "gemini", "n8n"],
    role: "Solo: product, frontend, AI pipeline",
    featured: 1,
    cover: "/images/projects/ui-ux-designer/cover",
    links: { repo: "https://github.com/Prateekiiitg56/UiUxDesign", live: "https://ui-ux-design-steel.vercel.app/" },
    hasCaseStudy: true,
  },
  // ...
] as const satisfies readonly Project[];
```

Also split the rest of `config.ts` into `profile.ts` (name, bio, socials, resume URL, availability), `experience.ts` and `now.ts`. Delete `config.ts` once nothing imports it.

### 5.3 Content workflow (automation)

**Real screenshots, captured automatically.** `scripts/capture-screens.ts`, run with `npx tsx scripts/capture-screens.ts`:

```ts
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { projects } from "../src/content/projects";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const p of projects) {
  if (!p.links.live) continue;
  const dir = `public/images/projects/${p.slug}`;
  await mkdir(dir, { recursive: true });
  await page.goto(p.links.live, { waitUntil: "networkidle", timeout: 45_000 });
  await page.waitForTimeout(1500); // let intro animations settle
  const png = await page.screenshot();
  await sharp(png).resize(1600).webp({ quality: 82 }).toFile(`${dir}/cover.webp`);
  console.log("captured", p.slug);
}
await browser.close();
```

Projects without a live site (SmartScribe, Music Prediction, Sketch-to-Color GAN, CodeCapsule) need a designed cover: a terminal or notebook screenshot inside the same browser frame, or a results image from the notebook.

**GitHub facts at build time.** `scripts/fetch-github.mjs` runs in `prebuild`, calls the GitHub REST API (`GET /repos/{owner}/{repo}`) for each repo link and writes `src/content/github.json` with stars, primary language and last push date. The site shows "Updated 3 days ago" without calling GitHub from the browser. Use `GITHUB_TOKEN` in CI to avoid rate limits; if the call fails, keep the previous JSON.

**Case-study text in MDX.** One file per project in `src/content/case-studies/<slug>.mdx`, loaded lazily only when its page opens:

```ts
// vite.config.ts
import mdx from "@mdx-js/rollup";
plugins: [{ enforce: "pre", ...mdx() }, react()],
```

```ts
// src/pages/CaseStudy.tsx
const bodies = import.meta.glob("../content/case-studies/*.mdx");
const load = bodies[`../content/case-studies/${slug}.mdx`];
const Body = lazy(load as () => Promise<{ default: React.ComponentType }>);
```

Template for each case study (keep it short, 400 to 900 words):

```md
## Overview
One paragraph: what it is, who it is for, what you did.

## The problem
What was hard or missing.

## Approach
Key decisions and why. One architecture diagram (export from Excalidraw as SVG).

## Highlights
3 to 5 features, each with a screenshot or short clip.

## Challenges and what I learned
The honest part. Recruiters read this.

## Results
Numbers if you have them: users, time saved, accuracy, Lighthouse score, stars.
```

### 5.4 /work page spec (`src/pages/Work.tsx`)

```
+--------------------------------------------------------------------------+
|  <- Home                                                                 |
|  All work                                   21 projects . 2023 to 2026   |
|  Short intro line                                                        |
|  +--------------------------------------------------------------------+  |
|  | [/] Search projects, tools...  | Sort: Featured v | [Grid][List]   |  |  sticky filter bar
|  | (All) (AI) (Full-stack) (3D) (Automation) (ML) (Tooling)           |  |
|  | Tools: [React] [Next.js] [Three.js] [Python] [n8n] [+8]            |  |
|  +--------------------------------------------------------------------+  |
|  Spotlight: 3 featured projects in a wide row (no hover swapping)        |
|  +-------------+ +-------------+ +-------------+                         |
|  | cover 16:10 | | cover       | | cover       |                         |
|  | Title  Live | | Title   WIP | | Title       |                         |
|  | tagline     | | tagline     | | tagline     |                         |
|  | chips +2    | | chips       | | chips       |                         |
|  | [Quick view]| |             | |             |                         |
|  +-------------+ +-------------+ +-------------+                         |
+--------------------------------------------------------------------------+
```

- **Filters in the URL**: `/work?cat=ai&tech=react&q=chat&sort=newest`, so a filtered view can be shared and the back button restores it.

```ts
// src/pages/work/useProjectFilters.ts
export function useProjectFilters() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const cats = params.getAll("cat") as ProjectCategory[];
  const tech = params.getAll("tech");
  const sort = (params.get("sort") ?? "featured") as "featured" | "newest" | "az";

  const update = (patch: Record<string, string | string[] | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      next.delete(k);
      if (Array.isArray(v)) v.forEach((x) => next.append(k, x));
      else if (v) next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const results = useMemo(() => filterAndSort(projects, { q, cats, tech, sort }), [q, cats.join(), tech.join(), sort]);
  return { q, cats, tech, sort, results, update };
}
```

- **Search**: debounced 150 ms, `/` focuses it, matches title, tagline, tool names and categories.
- **Chips**: multi-select, `aria-pressed`, the result count is announced in a polite live region ("8 projects").
- **Cards are links**: the title is an `<a href="/work/slug">` with a stretched `::after` covering the card; the "Quick view" button sits above it with a higher `z-index`. No nested interactive elements.
- **Hover**: cover zooms to 1.04, border uses the project accent, a 2-second muted loop plays if `video` exists (loaded only on hover, as `WorkImage.tsx` already attempts).
- **List view**: compact table rows (year, title, categories, stack, links). Hovering a row shows a floating preview image that follows the cursor (GSAP `quickTo`), a classic case-study index pattern.
- **Empty state**: keep the current one, add "Clear filters".
- **Random project**: keep, but navigate to the case study instead of opening the modal.

### 5.5 Case study page spec (`src/pages/CaseStudy.tsx`)

```
+--------------------------------------------------------------------------+
|  <- All work                                         Next project ->     |
|  AI . TOOLING . 2026                                                     |
|  UiUxDesigner                                                            |
|  Extracts a full design system from any URL...                           |
|  [ Live demo ]  ( Source code )                                          |
|  +--------------------------------------------------------------------+  |
|  |                 cover (shared element from the card)               |  |
|  +--------------------------------------------------------------------+  |
|  Role | Timeline | Stack | Status        (meta row, Geist Mono labels)   |
|  ---------------------------------------------------------------------   |
|  On this page:  Overview . Problem . Approach . Highlights . Results     |  sticky table of contents
|  MDX body (max 70 characters per line), images open in a lightbox        |
|  Metrics row:  [ 1.2k users ] [ 95 Lighthouse ] [ 40% faster ]           |
|  Related projects (same categories or stack)                              |
|  Next / previous project cards                                           |
+--------------------------------------------------------------------------+
```

- Unknown slug renders the 404 page with "Did you mean" suggestions (closest title).
- Focus moves to the `h1` after navigation, and the document title updates (`<title>UiUxDesigner · Prateek Singh</title>`).
- Scroll restores to the top on enter and back to the card position on return (React Router `ScrollRestoration`, or a small custom `useScrollRestore`, because Lenis is in control of scrolling).

### 5.6 Transitions between list and case study

Use React Router's built-in View Transitions support (`viewTransition` on `<Link>`) so the cover image morphs from the card into the case-study hero. Only the clicked card carries the transition name:

```tsx
// ProjectCard.tsx
const to = `/work/${p.slug}`;
const isTransitioning = useViewTransitionState(to);
<Link to={to} viewTransition className={styles.title}>{p.title}</Link>
<img src={cover} alt="" style={{ viewTransitionName: isTransitioning ? "project-cover" : "none" }} />
```

```tsx
// CaseStudy.tsx hero
<img src={cover} alt={p.title} style={{ viewTransitionName: "project-cover" }} />
```

```css
::view-transition-group(project-cover) { animation-duration: 560ms; animation-timing-function: cubic-bezier(.22,1,.36,1); }
```

Browsers without support simply navigate. Under reduced motion, skip the transition (`viewTransition={!reduce}`).

### 5.7 Quick view modal

Keep `ProjectModal.tsx` (shared-element flight in and out) for the "Quick view" button on cards. Add a primary "Read case study" link in it, a focus trap (set `inert` on `#root` while the modal is open, since the modal is portalled to `body`), and type the `project` prop with `Project`.

### 5.8 Sharing

Each case study gets its own title, description and Open Graph image (section 10).

### 5.9 Curation recommendations

- **Featured on home, in order**: UiUxDesigner, Lead Scraper, The Matrix, Apex Garage, Red Fizz, Unbias.xAI. These show range (AI tooling, full-stack product, education, 3D) and all have live demos.
- **Merge the four 3D landing pages** (ids 18 to 21) into one "3D Landing Page Series" project with four variants in its gallery. Four near-identical cards at the top weaken the first impression.
- **Short titles plus tagline**: "Lead-Scrapper - Enterprise B2B Lead Generation & Outreach CRM" becomes title "Lead Scraper" and tagline "B2B lead discovery, multi-channel outreach and an 8-stage CRM pipeline." (Check the spelling: "Scraper", not "Scrapper", in display text; the repo name can stay.)
- **Consistent casing**: "Unbias.xAI" everywhere.
- **Archive, do not delete**: older learning projects (CondBot, Music Prediction) get `status: "archived"` and appear after the rest unless filtered.

---

## 6. 3D hero V2

### 6.1 Options

| Option | What it is | Effort | Risk | Wow |
|---|---|---|---|---|
| **A. Upgrade the current desk character** | Same model you liked at the start, restyled to the new theme, monitor plays your real project footage, hologram hover, real loading progress | 2 to 3 days | Low | Medium to high |
| **B. Your own avatar** | Half-body 3D model of your face (Appendix A), cursor-following head and eyes, blink, wave, typing pose | 4 to 7 days (mostly asset work) | Medium: quality depends on the generated model | High, personal |
| C. Particle portrait | Your photo turned into a depth-displaced point cloud that follows the cursor and scatters on hover | 3 to 4 days | Medium: needs a clean depth map | High, abstract |

**Recommendation**: ship A in V2.0, because it is low risk and fixes the "looks the same as the template" concern by making the monitor show your actual work. Build B in parallel as V2.1 and swap it in behind a feature flag (`VITE_HERO=desk|avatar`) only when the model passes the checklist in 6.3.

### 6.2 Option A: upgrade the desk character

1. **Monitor shows your projects.** During chapter 02 the monitor plays a 10 to 15 second muted loop of your best projects (screen recordings stitched together, 960 by 540, under 1.5 MB WebM plus an MP4 fallback). The screen material is `Material.027` on the `Plane004` group, already found in `GsapScroll.ts`.

```ts
const video = Object.assign(document.createElement("video"), {
  src: "/video/monitor.webm", muted: true, loop: true, playsInline: true, preload: "none",
});
const tex = new THREE.VideoTexture(video);
tex.colorSpace = THREE.SRGBColorSpace;
tex.flipY = false; // glTF UV convention
const screen = monitor.material as THREE.MeshStandardMaterial;
screen.map = tex;
screen.emissiveMap = tex;
screen.emissive.set("#ffffff");
screen.emissiveIntensity = 0.9;
screen.needsUpdate = true;
// play when chapter 02 starts, pause when it ends (ScrollTrigger onToggle)
```

Check the screen's UVs first. If the screen has no clean 0 to 1 UV island, add a `PlaneGeometry` sized to the screen as a child of the monitor and put the video on that instead.

2. **Restyle materials to the theme.** Hoodie in the violet primitive, desk and chair in a neutral graphite, rim light in cyan. Do it in code by name (`character.getObjectByName("BODY.SHIRT")` and friends) so the model file stays untouched, or once in Blender.
3. **Light follows the theme.** In the light theme, raise ambient light and soften the rim (3.2).
4. **Hologram hover.** Keep the whole-layer fade (it has no transparency-sorting artifacts) and add scan lines:

```css
.character-model canvas.is-ghost {
  opacity: 0.35;
  -webkit-mask-image: repeating-linear-gradient(to bottom, #000 0 2px, rgb(0 0 0 / .55) 2px 4px);
  mask-image: repeating-linear-gradient(to bottom, #000 0 2px, rgb(0 0 0 / .55) 2px 4px);
}
```

5. **Hero composition.** Character on the right half in the Prologue (the timeline starts with `x: "18%"`), slides to the left for chapters 01 and 02 as it does now, then exits.
6. **Remove the encryption** if the model license allows, or keep it until option B replaces the model. The decrypt step adds CPU time and stops the browser from streaming the file.

### 6.3 Option B: your own avatar pipeline

1. **Generate**: use the prompt in Appendix A with a front-facing photo in Meshy, Tripo or Hunyuan3D (image to 3D), or create an Avaturn avatar from selfies.
2. **Rig**: auto-rig in the same tool or in Mixamo. Bones must follow Mixamo naming (`Hips`, `Spine`, `Spine1`, `Spine2`, `Neck`, `Head`, `LeftArm`, `LeftForeArm`, `RightArm`, `RightForeArm`, `LeftHand`, `RightHand`; a `mixamorig` prefix is fine).
3. **Clean up in Blender**:
   - Half body is fine, but keep the arms for the wave and typing poses.
   - 30k to 60k triangles, one or two materials, textures 1024 px (face texture 2048 px if needed).
   - Remove accessories that cover the face (Avaturn exports a VR headset as "glasses" by default).
   - If the export includes ARKit-style blend shapes (`eyeBlinkLeft`, `jawOpen`, `mouthSmileLeft`), keep them; they drive blinking and a smile on hover. If not, add two shape keys yourself: blink and smile.
   - Apply transforms, face +Z, T-pose or A-pose, export glTF binary.
4. **Compress**: meshopt geometry and WebP textures (meshopt decodes faster, and its decoder is a small fraction of the roughly 340 KB Draco wasm plus wrapper):

```bash
npx @gltf-transform/cli optimize raw/me.glb public/models/me.glb --compress meshopt --texture-compress webp --texture-size 1024
```

```ts
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
loader.setMeshoptDecoder(MeshoptDecoder);
```

5. **Integrate through one rig interface**, so the scene, scroll timeline and hover logic do not care which model is loaded:

```ts
// src/components/hero3d/rig.ts
export interface CharacterRig {
  root: THREE.Object3D;
  head: THREE.Object3D;                  // anchor for the speech bubble and hover zone
  pose: { intro: number; wave: number; work: number }; // tweened by GSAP
  setHover(on: boolean): void;
  update(dt: number, time: number, look: { x: number; y: number }): void;
  dispose(): void;
}
```

Pose arms with rotations defined in the model's T-pose world frame (this approach was prototyped in the last session and produced natural results):

```ts
// rest data captured once after load
const rest = new Map<THREE.Bone, { local: THREE.Quaternion; parentWorld: THREE.Quaternion; parentInv: THREE.Quaternion }>();
function setWorldDelta(bone: THREE.Bone, delta: THREE.Quaternion) {
  const r = rest.get(bone)!;
  bone.quaternion.copy(r.parentInv).multiply(delta).multiply(r.parentWorld).multiply(r.local);
}
// arms down from T-pose: left arm (at +X) rotates -1.2 rad around Z, right arm +1.2
```

6. **Acceptance checklist before it replaces option A**: looks like you at a glance, no visible seams at the neck, no texture stretching on the face, file under 1.5 MB, 60 fps on a mid-range laptop with integrated graphics, head turn feels natural across the full screen width.

### 6.4 Interaction spec (both options)

| Behaviour | Spec |
|---|---|
| Head follow | Yaw up to 30 degrees, pitch up to 18 degrees, critically damped (`lerp(current, target, 1 - exp(-6 * dt))`), eyes lead the head slightly if eye bones exist |
| Idle | Breathing (spine scale 1%), blink every 2.5 to 5.5 s, subtle weight shift |
| Hover | Whole layer fades to 35% with scan lines, eyebrows raise or smile, bubble says "Hey, you found me." |
| Scroll story | Prologue wave, chapter 01 turn toward the text, chapter 02 type at the desk with the monitor on, then exit upward |
| Touch devices | No hover; tapping the character plays the wave and shows the bubble |
| Reduced motion | Static pose, no head follow, no scroll choreography, bubble shown without animation |
| Off screen | Render loop paused (already done with `IntersectionObserver`), also paused on `visibilitychange` |

### 6.5 Mobile and tablet

- **Phones**: no WebGL. Show a pre-rendered transparent poster of the character (render it once from the three.js scene with `renderer.domElement.toBlob`, save as AVIF and WebP), with a gentle CSS float animation. Tapping it shows the speech bubble.
- **Tablets (769 to 1024 px)**: enable the 3D scene only when the device looks capable: `matchMedia("(pointer: fine)").matches || (navigator.hardwareConcurrency ?? 4) >= 8`, and not when `navigator.connection?.saveData` is true. Otherwise show the poster.
- Never block the page on the model: content renders first, the scene fades in when ready.

### 6.6 3D budget

| Item | Budget |
|---|---|
| Model file | 1.5 MB or less (target 1 MB) |
| Environment map | 300 KB HDR or replace with `RoomEnvironment` (generated in code, 0 KB) |
| Draw calls | under 60 |
| Device pixel ratio | capped at 1.75 |
| Frame time on scroll | under 12 ms on a mid-range laptop |

---

## 7. Engineering foundation

### 7.1 Dependency changes

| Action | Package | Reason |
|---|---|---|
| Remove | `animejs` | Duplicates GSAP |
| Remove | `react-fast-marquee` | Replaced by a CSS marquee |
| Remove | `terser` | Use esbuild minification (faster, far less memory) |
| Remove | `react-icons` (after migration) | One icon set |
| Move to devDependencies | `express`, `cors` | Only used by `server/dev-api.cjs` |
| Add | `@gsap/react` | `useGSAP` hook with automatic cleanup |
| Add | `@phosphor-icons/react` | Icon set |
| Add | `cmdk` | Command palette |
| Add | `@vercel/speed-insights` | Real-user Web Vitals |
| Add (dev) | `@playwright/test`, `@axe-core/playwright`, `@lhci/cli`, `sharp`, `tsx`, `rollup-plugin-visualizer` | Testing, images, scripts, bundle analysis |
| Add (optional) | `@mdx-js/rollup`, `remark-frontmatter`, `remark-mdx-frontmatter` | Case studies |
| Add (API) | `@upstash/ratelimit`, `@upstash/redis`, `resend` | Rate limits, contact email |
| Upgrade | `gsap` to 3.13 or newer | SplitText, Flip, ScrollSmoother and the other former bonus plugins are free since 3.13 |
| Upgrade | `react`, `react-dom` to 19, `@types/react` 19 | Current major; test `react-router-dom` and analytics after |
| Upgrade | `vite`, `@vitejs/plugin-react` to the latest stable | Faster builds |
| Upgrade | `three` to the latest release | Check the migration notes for loader renames before upgrading |

Also update the README: it still says GSAP bonus plugins need a paid club membership.

### 7.2 Folder structure

```
src/
  app/          App.tsx, routes.tsx, providers (Theme, Motion, Chapters), theme.ts
  content/      types.ts, profile.ts, projects.ts, experience.ts, tools.ts, now.ts,
                github.json (generated), case-studies/*.mdx
  design/       tokens.css, fonts.css, base.css (reset, focus styles), utilities.css
  motion/       gsap.ts (register plugins, defaults), lenis.ts, presets.ts, useReveal.ts
  components/
    ui/         Button, Chip, Badge, Card, Img, Toast, Dialog, Kbd
    layout/     Nav, MobileMenu, Footer, Chapter, StoryRail, CommandPalette, Cursor, Loader
    hero3d/     HeroScene.tsx, rig.ts, rigs/deskRig.ts, rigs/avatarRig.ts, loaders.ts
  sections/     Hero, About, Capabilities, SelectedWork, Journey, Toolbox, Playground, Contact
  pages/        Home.tsx, Work.tsx, CaseStudy.tsx, Play.tsx, NotFound.tsx, work/useProjectFilters.ts
scripts/        capture-screens.ts, optimize-images.mjs, fetch-github.mjs,
                prerender-meta.mjs, build-ai-context.ts
api/            chat.js, contact.js, _context.json (generated)
```

### 7.3 Styling approach

- Keep plain CSS (no Tailwind migration in V2), but switch component styles to CSS Modules (`Hero.module.css`), which Vite supports out of the box. Class names stop leaking between sections, which is the root cause of the bug where the project modal picked up `.work-section h2` styles.
- Global CSS is limited to `design/*.css`.
- Use container queries for cards, `clamp()` tokens for type and spacing, and logical properties (`margin-inline`, `padding-block`).

### 7.4 Animation architecture

1. **One registration point** (`src/motion/gsap.ts`):

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP);
gsap.defaults({ ease: "expo.out", duration: 0.8 });
export { gsap, ScrollTrigger, SplitText, Flip, useGSAP };
```

2. **Lenis driven by the GSAP ticker**, so smooth scrolling and scrubbed timelines read the same frame:

```ts
// src/motion/lenis.ts
export const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 }); // current config (duration 1.7, wheelMultiplier 1.7) feels floaty
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

3. **`useGSAP` everywhere**, scoped to a ref, with reduced motion handled by `gsap.matchMedia()`:

```tsx
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    SplitText.create(headingRef.current!, {
      type: "lines", mask: "lines", autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 110, stagger: 0.08, duration: 0.9,
        scrollTrigger: { trigger: headingRef.current, start: "top 80%" },
      }),
    });
  });
}, { scope: sectionRef });
```

This replaces the custom `TextSplitter`, `splitText.ts`, the global `ScrollTrigger.addEventListener("refresh", ...)` and the manual cleanup code in every component.

4. **Refresh after layout settles**: `document.fonts.ready.then(() => ScrollTrigger.refresh())`, and refresh once more after the hero image and the model load.
5. **Use refs, not global selectors.** `GsapScroll.ts` currently targets `.character-model`, `.about-section` and others by class name from inside the 3D code. Pass elements in, or let each section own its own timeline and expose a progress value the 3D scene reads.
6. **Consistent scrub**: numeric scrub between 0.6 and 1 everywhere for a smooth catch-up feel.

### 7.5 Content layer

All copy lives in `src/content/`. Components never contain project facts. The AI chat context is generated from the same files (11.1), so the chat can never contradict the site.

### 7.6 Build fix

```json
// package.json
"scripts": {
  "dev": "concurrently -k \"npm:dev:api\" \"npm:dev:web\"",
  "dev:web": "vite --host",
  "dev:api": "node server/dev-api.cjs",
  "typecheck": "tsc -b",
  "prebuild": "node scripts/fetch-github.mjs && npx tsx scripts/build-ai-context.ts",
  "build": "tsc -b && vite build",
  "postbuild": "node scripts/prerender-meta.mjs",
  "lint": "eslint .",
  "test:e2e": "playwright test",
  "analyze": "vite build --mode analyze",
  "preview": "vite preview"
}
```

```ts
// vite.config.ts
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "analyze" && visualizer({ open: true, gzipSize: true })],
  esbuild: { drop: mode === "production" ? ["console", "debugger"] : [] },
  build: {
    target: "es2022",
    rollupOptions: { output: { manualChunks: { three: ["three"], gsap: ["gsap"] } } },
  },
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString()) },
}));
```

Removing `minify: "terser"` and the `NODE_OPTIONS` prefix fixes both the Windows script error and the out-of-memory build.

### 7.7 TypeScript

- Turn on `"noUncheckedIndexedAccess": true` once the content layer is typed.
- Remove every `any` in components (`project: any`, `child: any`, `screenLight: any`).

---

## 8. Performance

### 8.1 Budgets

| Budget | Mobile | Desktop |
|---|---|---|
| Initial JS (gzip) | 170 KB | 220 KB plus the lazy 3D chunk |
| Initial transfer | 1.0 MB | 2.5 MB including the model |
| LCP | 2.0 s on 4G | 1.5 s |
| CLS | 0.05 | 0.05 |
| Long tasks during scroll | none over 50 ms | none over 50 ms |

### 8.2 Techniques

1. **3D only where it pays**: keep `CharacterModel` lazy and gated (6.5). Preload the model only on desktop, from an inline script in `index.html`:

```html
<script>
  if (matchMedia("(min-width: 1025px)").matches) {
    var l = document.createElement("link");
    l.rel = "preload"; l.as = "fetch"; l.href = "/models/character.glb"; l.crossOrigin = "anonymous";
    document.head.appendChild(l);
  }
</script>
```

2. **No loader on phones**, so the hero headline is the LCP element and paints immediately.
3. **Self-hosted fonts** with one preload (3.3).
4. **Local tech icons** instead of 40 or more CDN requests (3.6).
5. **Toolbox background video removed**; the monitor video (6.2) loads with `preload="none"` and starts only in chapter 02.
6. **Route-level code splitting**: `/work`, `/work/:slug`, `/play` and the command palette are separate chunks (already partly true).
7. **`content-visibility: auto`** with `contain-intrinsic-size` on chapters 04 to 06, so the browser skips their rendering work until they are near.
8. **Third-party scripts**: Vercel Analytics and Speed Insights only, both deferred.

### 8.3 Image pipeline

`scripts/optimize-images.mjs` (sharp) turns every source image in `assets/images/` into AVIF and WebP at 480, 960 and 1600 px wide, and writes `src/content/images.json` with the intrinsic size and a 16 px blurred placeholder:

```js
for (const file of files) {
  const base = path.join("public/images", path.parse(file).name);
  const meta = await sharp(file).metadata();
  for (const w of [480, 960, 1600]) {
    await sharp(file).resize(w).avif({ quality: 55 }).toFile(`${base}-${w}.avif`);
    await sharp(file).resize(w).webp({ quality: 78 }).toFile(`${base}-${w}.webp`);
  }
  const blur = await sharp(file).resize(16).webp({ quality: 40 }).toBuffer();
  manifest[base] = { width: meta.width, height: meta.height, blur: `data:image/webp;base64,${blur.toString("base64")}` };
}
```

An `<Img>` component reads the manifest, sets `width` and `height` (no layout shift), `srcset`, `sizes`, `loading="lazy"` (or `fetchpriority="high"` for the LCP image) and shows the blurred placeholder until the image decodes.

### 8.4 Measuring

- `npm run analyze` opens a treemap of the bundle.
- Lighthouse CI on every PR with the budgets above as assertions (12).
- Vercel Speed Insights for real-user numbers after launch.

---

## 9. Accessibility

Target: WCAG 2.2 AA.

| Fix | Where | How |
|---|---|---|
| Allow text selection | `src/index.css` | Delete `user-select: none` from `:root`; keep it only on purely decorative elements |
| Readable contrast | `WhatIDo.css` line 92, `Play.css` | Use `--text-2` / `--text-3` tokens (3.2) |
| Minimum text size | files listed in section 2 | 12 px minimum for labels, 16 px body |
| Heading order | `Landing.tsx`, all sections | One `h1` (hero headline), each chapter title is an `h2` linked with `aria-labelledby` |
| Landmarks and skip link | `App.tsx` | `<header>`, `<nav>`, `<main id="main">`, `<footer>`; "Skip to content" as the first focusable element |
| Visible focus | `design/base.css` | `:focus-visible { outline: none; box-shadow: var(--focus-ring); }` on every interactive element |
| Real links and buttons | `MyWorks.tsx`, `Work.tsx` | Cards use links; no `div` with click handlers |
| Modal focus | `ProjectModal.tsx`, mobile menu, command palette | Trap focus with `inert` on the rest of the page, return focus to the trigger on close |
| Target size | story rail dots, social icons | Hit area of at least 24 by 24 px |
| Reduced motion | all animations | `gsap.matchMedia` (7.4), static marquee, no loader, no scroll choreography |
| Announcements | filters, form, copy email | One polite live region (4.4 toasts) |
| Alt text | project covers, photo | Descriptive alt on case-study hero; empty alt on decorative duplicates |
| Body scroll during loader | `index.css`, `initialFX.ts` | Do not lock scrolling with `overflow: hidden` on the body when the loader is skipped or JavaScript fails |
| Route changes | all pages | Move focus to the page `h1` and update the document title |

Check with `@axe-core/playwright` in CI and a manual keyboard-only pass of the full site before launch.

---

## 10. SEO and sharing

### 10.1 Per-route meta without a framework change

Vercel serves a static file when one exists at the requested path, and only falls back to the `index.html` rewrite otherwise (confirm on a preview deploy). That allows a small post-build script to write one HTML file per route with the right `<head>`:

```js
// scripts/prerender-meta.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
const shell = await readFile("dist/index.html", "utf8");
const site = "https://prateek-portfolio-tau.vercel.app";
const routes = [
  { path: "/", title: "Prateek Singh · Full-stack & AI developer", desc: "...", og: "/og/home.png" },
  { path: "/work", title: "Work · Prateek Singh", desc: "...", og: "/og/work.png" },
  ...projects.map((p) => ({ path: `/work/${p.slug}`, title: `${p.title} · Prateek Singh`, desc: p.tagline, og: `/og/${p.slug}.png` })),
];
for (const r of routes) {
  const head = `
    <title>${r.title}</title>
    <meta name="description" content="${r.desc}" />
    <link rel="canonical" href="${site}${r.path}" />
    <meta property="og:title" content="${r.title}" />
    <meta property="og:description" content="${r.desc}" />
    <meta property="og:image" content="${site}${r.og}" />
    <meta name="twitter:card" content="summary_large_image" />`;
  const html = shell.replace(/<title>.*?<\/title>/, head);
  const dir = `dist${r.path === "/" ? "" : r.path}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/index.html`, html);
}
```

(The project list needs to be readable from Node: run the script with `tsx`, or have `build-ai-context.ts` also write a small `dist/projects.json` the script reads.)

If you later want the full page content pre-rendered, React Router 7 framework mode can prerender static routes. That is a bigger change and is optional for V2.

### 10.2 Open Graph images

Generate a 1200 by 630 PNG per route at build time with `satori` (JSX to SVG) and `@resvg/resvg-js` (SVG to PNG): dark background, project title in Geist, tagline, cover thumbnail, your name. Output to `public/og/`.

### 10.3 Structured data and files

- JSON-LD `Person` on the home page (name, job title, URL, `sameAs` links to GitHub and LinkedIn).
- JSON-LD `CreativeWork` on each case study.
- `public/robots.txt` and a generated `public/sitemap.xml` (same route list as above).
- Consider a custom domain (for example `prateeksingh.dev`) for credibility and cleaner links.

---

## 11. Security and API

### 11.1 Harden `/api/chat`

- **Why**: the endpoint accepts any messages, including a system prompt, and forwards them with your Groq key. Anyone can use it as a free LLM service until your quota or bill runs out.
- **How**:

```js
// api/chat.js (sketch)
import context from "./_context.json" with { type: "json" }; // generated from src/content at build
const MAX_MESSAGES = 12;
const MAX_CHARS = 1000;
const ALLOWED = new Set(["https://prateek-portfolio-tau.vercel.app", "http://localhost:5173"]);
const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(20, "10 m") }); // @upstash/ratelimit

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (req.headers.origin && !ALLOWED.has(req.headers.origin)) return res.status(403).json({ error: "Forbidden" });

  const { success } = await ratelimit.limit(req.headers["x-forwarded-for"] ?? "anon"); // e.g. 20 requests / 10 min
  if (!success) return res.status(429).json({ error: "Too many requests, try again in a few minutes." });

  const input = Array.isArray(req.body?.messages) ? req.body.messages.slice(-MAX_MESSAGES) : [];
  const messages = input
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!messages.length) return res.status(400).json({ error: "Empty conversation" });

  const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 400,
      temperature: 0.6,
      messages: [{ role: "system", content: context.systemPrompt }, ...messages],
    }),
  });
  // ...return only the assistant text, never upstream error details
}
```

- Move `SYSTEM_PROMPT` out of `Play.tsx`. `scripts/build-ai-context.ts` builds it from `src/content/` and writes `api/_context.json`.
- Return generic error messages; log details server-side only.

### 11.2 Contact form API (`api/contact.js`)

Validate name (1 to 80 chars), email (format check), message (10 to 2000 chars); reject when the honeypot field is filled; rate limit 3 per hour per IP; send with Resend to your inbox with `reply_to` set to the sender. Respond `{ ok: true }` or a field-level error object the form can show inline.

### 11.3 Headers (`vercel.json`)

Add, starting with `Content-Security-Policy-Report-Only` for a week before enforcing:

```json
{ "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-<theme-script-hash>'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'" },
{ "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
{ "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
```

`'wasm-unsafe-eval'` is needed for the Draco decoder and the chess engine. Remove the deprecated `X-XSS-Protection` header.

---

## 12. Testing and CI

### 12.1 Tests

- **Smoke (Playwright)**: home loads with no console errors; every chapter is reachable from the nav; `/work` filters update the URL and the result count; a case study opens from a card and the back button restores the filters; the quick view modal opens and closes and returns focus; the command palette opens with `Ctrl K`; the theme toggle persists after reload.
- **Accessibility**: `@axe-core/playwright` on `/`, `/work`, one case study and `/play`, in both themes. Zero serious or critical violations.
- **Visual**: `expect(page).toHaveScreenshot()` for the hero, a project card and the case-study header at 390 and 1440 px, with animations disabled (`reducedMotion: "reduce"`).
- **Reduced motion**: one test run with `reducedMotion: "reduce"` checks every chapter is visible without scrolling animations.

### 12.2 CI workflow

```yaml
# .github/workflows/ci.yml
name: ci
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - run: npx @lhci/cli autorun
```

`lighthouserc.json` asserts the budgets from section 8.1 (performance 0.9, accessibility 1.0, LCP under 2000 ms, CLS under 0.05).

### 12.3 Branching and release

- Build V2 on a `v2` branch; every PR gets a Vercel preview URL.
- The production site stays on V1.5 until the launch checklist (13, phase 6) passes.
- Use the `VITE_HERO` flag to switch the 3D character without code changes.

---

## 13. Roadmap

Estimates assume part-time work (2 to 4 focused hours a day).

### Phase 0: Foundation (1 to 2 days)

- [ ] Create the `v2` branch, commit the current V1.5 state first.
- [ ] Fix the build (7.6), remove terser, `animejs`, `react-fast-marquee`; move `express` and `cors` to devDependencies.
- [ ] Add `@gsap/react`, upgrade GSAP to 3.13 or newer, register plugins in `src/motion/gsap.ts`.
- [ ] Drive Lenis from the GSAP ticker (7.4).
- [ ] Split `config.ts` into `src/content/*` with types (5.2).
- [ ] Add CI with lint, typecheck and build (12.2, tests come later).

**Done when**: `npm run build` passes on Windows and in CI, the site looks the same as V1.5, and scrolling feels at least as smooth.

### Phase 1: Design system and theme (2 to 3 days)

- [ ] `tokens.css`, `fonts.css`, `base.css` (3.2 to 3.5), self-hosted fonts.
- [ ] Migrate all component CSS to tokens; remove raw hex values and z-index literals.
- [ ] Theme toggle with the no-flash script and circular reveal (3.2).
- [ ] UI primitives: Button, Chip, Badge, Card, Img, Toast, Kbd.
- [ ] Phosphor icons replace `react-icons`.
- [ ] Accessibility basics: remove `user-select: none`, focus ring, minimum text sizes, skip link, landmarks.

**Done when**: both themes pass axe colour contrast, no text under 12 px, every interactive element shows a focus ring.

### Phase 2: Home page story (5 to 7 days)

- [ ] `Chapter` component and registry; StoryRail reads from it (4.4).
- [ ] Nav (floating pill, active chapter, hide on scroll), mobile menu, footer.
- [ ] Hero with headline, CTAs, availability, local time, proof strip (4.5).
- [ ] About, Capabilities bento, Selected work stacking cards, Journey, Toolbox, Playground, Contact (4.5).
- [ ] Command palette (4.4).
- [ ] Contextual cursor labels, toasts, copy email.
- [ ] Rebuild all section animations with `useGSAP` and `gsap.matchMedia`; delete `splitText.ts`, `textSplitter.ts`, `initialFX.ts` and anime.js usages.
- [ ] Loader: real progress, skip on repeat visits and on phones (4.4).

**Done when**: the full story reads correctly with JavaScript animations disabled (reduced motion), works at 390, 768, 1024 and 1440 px, and every chapter is reachable by keyboard.

### Phase 3: Work page and case studies (4 to 6 days)

- [ ] Content curation (5.9) and new project fields for all projects.
- [ ] Screenshot capture script and image pipeline (5.3, 8.3).
- [ ] `/work` with URL filters, search, sort, grid and list views (5.4); redirect `/myworks`.
- [ ] `/work/:slug` case-study page with MDX body (5.5); write case studies for the six featured projects first.
- [ ] View transitions card to case study (5.6); quick view modal with "Read case study" and focus trap (5.7).
- [ ] GitHub facts script (5.3).

**Done when**: every project has a URL, filters survive reload and the back button, and a case study opens from both home and `/work` with the shared-element transition.

### Phase 4: 3D hero V2 (option A 2 to 3 days, option B plus 4 to 7 days)

- [ ] Option A: monitor video texture, theme-aware materials and lights, hologram hover, new hero composition, real loading progress (6.2).
- [ ] Mobile poster and tablet capability check (6.5).
- [ ] Rig interface so the model can be swapped (6.3 step 5).
- [ ] Option B in parallel: generate, rig, clean, compress, integrate behind `VITE_HERO=avatar`, pass the checklist (6.3).

**Done when**: 60 fps on a mid-range laptop, model under 1.5 MB, phones never download WebGL code or the model.

### Phase 5: Performance, SEO, security, tests (2 to 3 days)

- [ ] Budgets met (8.1), bundle analysed, `content-visibility` on lower chapters.
- [ ] Meta prerender, OG images, JSON-LD, sitemap, robots (10).
- [ ] Chat API hardening and contact API (11.1, 11.2); security headers in report-only mode (11.3).
- [ ] Playwright smoke, axe, visual tests, Lighthouse CI (12).
- [ ] Speed Insights added.

**Done when**: CI is green with Lighthouse assertions, and a link to any case study shows the right preview card in a chat app.

### Phase 6: Launch (1 to 2 days)

- [ ] Content proofread (no typos, consistent names, dates correct).
- [ ] Cross-browser pass: Chrome, Safari (macOS and iOS), Firefox, Edge; Android Chrome.
- [ ] Keyboard-only and screen-reader pass (NVDA on Windows, VoiceOver on Mac or iPhone).
- [ ] Enforce the CSP after a week without violations.
- [ ] Merge `v2` to `main`, deploy, check Speed Insights after 48 hours.
- [ ] Update the README (stack, scripts, how to add a project, how to swap the 3D model).

**Total**: about 4 to 6 weeks part-time, or 2 to 3 weeks full-time.

### Later (V2.x ideas)

- Writing section (MDX dev logs: GSoC journey, project write-ups) for SEO and storytelling.
- GitHub contribution graph in the Journey chapter.
- `/resume` as an HTML page generated from the same content, with a print stylesheet.
- Subtle UI sounds with a mute toggle (off by default).
- A "guestbook" or "say hi" wall backed by a small database.

---

## 14. Decisions needed from you

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Theme | A: Signal dark + Paper light (section 3). B: keep the current neon cyan/violet/magenta. C: monochrome editorial with one blue accent. | A |
| 2 | Light theme | Ship in V2.0, or dark only for now | Ship it; it is cheap once tokens exist |
| 3 | Headline fonts | Geist + Geist Mono + Instrument Serif accent, or Space Grotesk + DM Sans | Geist set |
| 4 | 3D hero | Option A, B or C (section 6) | A now, B later |
| 5 | Featured projects | The six in 5.9, or your own pick | 5.9 |
| 6 | 3D landing pages | Merge into one "series" project, or keep four | Merge |
| 7 | Contact | Form via Resend, or email link only | Form + copy email |
| 8 | AI chat | Keep on `/play`, also offer it from the command palette, or remove | Keep, harden |
| 9 | Custom domain | Buy one (for example `prateeksingh.dev`) or stay on `vercel.app` | Buy one |
| 10 | Content you need to provide | College and graduation year, 2 to 3 measurable outcomes per featured project, current "Now" items, a front-facing photo for the avatar | needed before Phase 3 |

---

## Appendix A: avatar generation prompt

Use with a front-facing, evenly lit photo in Meshy, Tripo or Hunyuan3D (image to 3D):

> Stylized 3D half-body portrait of the person in the reference photo, waist up, facing forward in a relaxed A-pose. Keep their facial features, hairstyle and skin tone faithful. Clean semi-realistic look with soft stylized shading and a professional, friendly expression. Plain dark crew-neck tee or hoodie, no accessories covering the face. Neutral lighting, plain background, one watertight mesh, PBR textures.

Export settings: glTF binary (GLB), under 5 MB before compression, textures 1024 px, auto-rigged humanoid skeleton with bones named `Head` and `Neck` (Mixamo naming). Then follow 6.3.

---

## Appendix B: file change map

| Current file | V2 |
|---|---|
| `src/config.ts` | Split into `src/content/profile.ts`, `projects.ts`, `experience.ts`, `tools.ts`, `now.ts` |
| `src/index.css`, `src/App.css` | `src/design/tokens.css`, `fonts.css`, `base.css` |
| `src/components/Landing.tsx` | `src/sections/Hero.tsx` |
| `src/components/About.tsx` | `src/sections/About.tsx` |
| `src/components/WhatIDo.tsx` | `src/sections/Capabilities.tsx` (bento) |
| `src/components/Career.tsx` | `src/sections/Journey.tsx` |
| `src/components/Work.tsx`, `WorkImage.tsx` | `src/sections/SelectedWork.tsx`, `src/components/ui/Img.tsx` |
| `src/components/TechStackNew.tsx` | `src/sections/Toolbox.tsx` (data-driven) |
| `src/components/CallToAction.tsx` | `src/sections/Playground.tsx` |
| `src/components/Contact.tsx` | `src/sections/Contact.tsx` (with form) |
| `src/components/Navbar.tsx` | `src/components/layout/Nav.tsx`, `MobileMenu.tsx`; Lenis moves to `src/motion/lenis.ts` |
| `src/components/SocialIcons.tsx` | Socials move to the footer and contact; fixed side icons optional |
| `src/components/StoryProgress.tsx` | `src/components/layout/Chapter.tsx` + `StoryRail.tsx` |
| `src/components/Cursor.tsx` | `src/components/layout/Cursor.tsx` (with labels) |
| `src/components/Loading.tsx`, `context/LoadingProvider.tsx` | `src/components/layout/Loader.tsx` (real progress, skippable) |
| `src/components/Character/*` | `src/components/hero3d/*` with the `CharacterRig` interface |
| `src/components/utils/GsapScroll.ts` | Section-owned timelines + `src/components/hero3d/choreography.ts` |
| `src/components/utils/splitText.ts`, `src/utils/textSplitter.ts`, `initialFX.ts` | Deleted, replaced by SplitText and `useGSAP` |
| `src/components/ProjectModal.tsx` | `src/components/ui/QuickView.tsx` (typed, focus trap, case-study link) |
| `src/pages/MyWorks.tsx` | `src/pages/Work.tsx` + `src/pages/CaseStudy.tsx` |
| `src/pages/Play.tsx` | Kept; system prompt moves server-side, styles move to tokens |
| `api/chat.js` | Hardened (11.1); new `api/contact.js` |
| `public/models/character.enc` | Plain optimised GLB (option A) or `me.glb` (option B) |
| `public/video/video.webm` | Removed; new `public/video/monitor.webm` for the desk monitor |
