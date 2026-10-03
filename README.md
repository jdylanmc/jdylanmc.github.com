# jdylanmc.github.com

Personal site for Dylan McCurry — built with [Astro](https://astro.build). Static output, no
server runtime, deployed via GitHub Pages.

## Structure

```text
src/
├── content/blog/     # Markdown blog posts (content collection)
├── layouts/          # Base page layout (nav, theme toggle, footer)
├── components/       # ThemeToggle, etc.
├── styles/           # themes.css (12 switchable skins) + global.css
└── pages/
    ├── index.astro
    ├── about.astro
    ├── resume.astro
    ├── links.astro
    ├── blog/
    └── projects/      # One page per project (cmux-maestro, pr-sniper, dotfiles, cacophony,
                        # plus two restored 2011 demos)
public/demos/          # Static legacy demo apps (JS Particle Engine, Wikipedia Visualization),
                        # embedded live via <iframe> on their project pages.
```

## Theming

The site ships 12 switchable visual themes (Terminal/Nord is the default) via CSS custom
properties on `<html data-theme="...">`. See `src/styles/themes.css` and
`src/components/ThemeToggle.astro`. The selection persists in `localStorage`.

## Commands

| Command             | Action                                      |
| -------------------- | -------------------------------------------- |
| `npm install`        | Install dependencies                        |
| `npm run dev`         | Start local dev server at `localhost:4321`  |
| `npm run build`       | Build the production site to `./dist/`      |
| `npm run preview`     | Preview the production build locally        |
