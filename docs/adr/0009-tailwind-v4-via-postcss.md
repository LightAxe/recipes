Status: accepted

# Tailwind CSS v4 is wired via PostCSS, not the @tailwindcss/vite plugin

We use Tailwind v4 through `@tailwindcss/postcss` (a `postcss.config.mjs`), not the
`@tailwindcss/vite` plugin that the Astro siblings use, because Astro 6 bundles a
**rolldown-based Vite** whose resolve-plugin interface the Tailwind Vite plugin doesn't
support yet — it fails the build with `Missing field tsconfigPaths on
BindingViteResolvePluginConfig`. The PostCSS path runs Tailwind as a standard CSS
transform and avoids the rolldown resolve plugin entirely. Astro is also pinned to the
sibling-proven `~6.1.8` line.

## Consequences

- A `postcss.config.mjs` is the source of the Tailwind wiring; `astro.config.mjs` has no
  Tailwind plugin. Functionally identical output (`@import "tailwindcss"` in
  `src/styles/global.css` still works).
- Revisit if/when `@tailwindcss/vite` supports rolldown-Vite — switching back is a small,
  isolated change.
