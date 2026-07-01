// Site-wide search island (header box + the /search/ page both use it). Pagefind is
// **lazy-loaded** — its WASM + index are fetched on first focus/keystroke, never on page
// load — so idle pages keep their performance budget. The one exception is a deep-linked
// /search/?q=… , which auto-runs on load (handled at the bottom).
//
// Security: Pagefind result metadata derives from recipe frontmatter and is untrusted
// client data. Titles/meta are written with textContent (never innerHTML); only
// Pagefind's own `excerpt` (which escapes text and injects just <mark>) uses innerHTML;
// and a result URL must match ^/recipes/ before it can become an href.

type PagefindResultData = {
  url?: unknown;
  excerpt?: unknown;
  meta?: { title?: unknown; course?: unknown; image?: unknown; image_alt?: unknown };
};
type PagefindModule = {
  search: (q: string) => Promise<{ results: { data: () => Promise<PagefindResultData> }[] }>;
};

let pfPromise: Promise<PagefindModule> | null = null;
function loadPagefind(): Promise<PagefindModule> {
  if (!pfPromise) {
    // Non-literal specifier (typed `string`, not a literal) + @vite-ignore so neither
    // TS nor the bundler tries to resolve the generated index at build time (it only
    // exists in dist/ after `pagefind`).
    const url: string = '/pagefind/pagefind.js';
    pfPromise = import(/* @vite-ignore */ url).catch((e) => {
      pfPromise = null; // allow a later retry (e.g. dev, where there is no index)
      throw e;
    });
  }
  return pfPromise;
}

function safeRecipeUrl(u: unknown): string | null {
  return typeof u === 'string' && /^\/recipes\/[a-z0-9][a-z0-9-]*\/$/i.test(u) ? u : null;
}
const text = (v: unknown): string => (typeof v === 'string' ? v : '');

function renderResults(container: HTMLElement, items: PagefindResultData[]): void {
  container.replaceChildren();
  const usable = items.filter((it) => safeRecipeUrl(it.url));
  if (!usable.length) {
    const p = document.createElement('p');
    p.className = 'sr-empty';
    p.textContent = 'No recipes found.';
    container.append(p);
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'sr-list';
  ul.setAttribute('role', 'list');
  for (const it of usable) {
    const a = document.createElement('a');
    a.className = 'sr-card';
    a.href = safeRecipeUrl(it.url)!;

    const title = document.createElement('span');
    title.className = 'sr-title';
    title.textContent = text(it.meta?.title) || 'Recipe'; // textContent: no HTML injection
    a.append(title);

    const course = text(it.meta?.course);
    if (course) {
      const c = document.createElement('span');
      c.className = 'sr-course';
      c.textContent = course;
      a.append(c);
    }

    const excerpt = text(it.excerpt);
    if (excerpt) {
      const ex = document.createElement('p');
      ex.className = 'sr-excerpt';
      ex.innerHTML = excerpt; // Pagefind-escaped text + <mark> only — safe by Pagefind's contract
      a.append(ex);
    }

    const li = document.createElement('li');
    li.append(a);
    ul.append(li);
  }
  container.append(ul);
}

const MAX_RESULTS = 8;

function wire(input: HTMLInputElement, results: HTMLElement, dropdown: boolean): void {
  let debounce = 0;
  let lastQuery = '';

  async function run(raw: string): Promise<void> {
    const query = raw.trim();
    lastQuery = query;
    if (!query) {
      results.replaceChildren();
      if (dropdown) results.hidden = true;
      return;
    }
    try {
      const pf = await loadPagefind();
      const search = await pf.search(query);
      if (query !== lastQuery) return; // a newer keystroke superseded this one
      const items = await Promise.all(
        search.results.slice(0, MAX_RESULTS).map((r) => r.data()),
      );
      if (query !== lastQuery) return;
      renderResults(results, items);
      results.hidden = false;
    } catch {
      // No index (dev) or load failure: degrade silently — the <form> still submits
      // to /search/ as the non-JS fallback.
      if (dropdown) results.hidden = true;
    }
  }

  input.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => void run(input.value), 180);
  });
  // Lazy warm-up: kick off the Pagefind fetch the moment the user engages the box.
  input.addEventListener('focus', () => void loadPagefind().catch(() => {}), { once: true });

  if (dropdown) {
    document.addEventListener('click', (e) => {
      if (e.target !== input && !results.contains(e.target as Node)) results.hidden = true;
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') results.hidden = true;
    });
  }
}

// Header box (dropdown).
const headerInput = document.getElementById('site-search') as HTMLInputElement | null;
const headerResults = document.getElementById('site-search-results');
if (headerInput && headerResults) wire(headerInput, headerResults, true);

// /search/ page (inline results) — auto-run a deep-linked ?q= on page load.
const pageInput = document.getElementById('search-page-input') as HTMLInputElement | null;
const pageResults = document.getElementById('search-page-results');
if (pageInput && pageResults) {
  wire(pageInput, pageResults, false);
  const q = new URLSearchParams(location.search).get('q');
  if (q) {
    pageInput.value = q;
    pageInput.dispatchEvent(new Event('input'));
  }
}
