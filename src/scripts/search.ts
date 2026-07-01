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
// How many ranked results to fetch/inspect before capping — a bounded window so the
// URL filter can run *before* the cap without fetching the entire result set.
const FETCH_MULTIPLIER = 4;

interface WireOpts {
  dropdown: boolean;
  /** Visually-hidden aria-live region — announces the result count to screen readers. */
  status?: HTMLElement | null;
  /** Browse-fallback block (on /search/) — hidden while a query is active. */
  fallback?: HTMLElement | null;
}

function wire(input: HTMLInputElement, results: HTMLElement, opts: WireOpts): void {
  const { dropdown, status = null, fallback = null } = opts;
  const container = input.closest('form') ?? input.parentElement;
  let debounce = 0;
  let lastQuery = '';
  // True once the user has closed the dropdown (Esc / outside-click / tab-out); an in-flight
  // Pagefind response then drops itself instead of reopening the panel. Reset on the next
  // keystroke. (Only meaningful for the dropdown; the /search/ page never dismisses.)
  let dismissed = false;
  const announce = (msg: string) => {
    if (status) status.textContent = msg;
  };
  const setVisible = (visible: boolean) => {
    results.hidden = !visible;
  };
  // The dropdown floats over the page, so a resolving async search must not reopen it once
  // focus has left the search box (e.g. the user tabbed/clicked away while it loaded).
  const focusInside = () => {
    const a = document.activeElement;
    return !!a && (a === input || (!!container && container.contains(a)));
  };

  async function run(raw: string): Promise<void> {
    const query = raw.trim();
    lastQuery = query;
    if (!query) {
      results.replaceChildren();
      setVisible(false);
      if (fallback) fallback.hidden = false; // no query → offer the browse fallback
      announce('');
      return;
    }
    if (fallback) fallback.hidden = true; // querying → the fallback would just be noise
    try {
      const pf = await loadPagefind();
      const search = await pf.search(query);
      if (query !== lastQuery) return; // a newer keystroke superseded this one
      // We index only recipe pages (data-pagefind-body), but stay robust if that ever
      // changes: fetch a bounded window, drop any non-recipe URL, and cap AFTER filtering
      // so a stray indexed page could never push real recipe hits out of the shown set.
      const stubs = search.results.slice(0, MAX_RESULTS * FETCH_MULTIPLIER);
      // Fail-soft: one fragment's data() rejecting must not sink the whole query — keep the
      // fulfilled results and drop the failures. (Promise.all would reject the lot.)
      const settled = await Promise.allSettled(stubs.map((r) => r.data()));
      // Re-check the guards *after* the awaited settle, before touching the DOM:
      if (query !== lastQuery) return; // a newer keystroke superseded this one
      // Dropdown only: if the user has since closed it or moved focus away, drop this
      // result entirely (don't re-render, re-show, or announce over the page).
      if (dropdown && (dismissed || !focusInside())) return;
      const fetched = settled
        .filter(
          (s): s is PromiseFulfilledResult<PagefindResultData> => s.status === 'fulfilled',
        )
        .map((s) => s.value);
      // Every fragment failed (not merely some) → treat as an outage, not "no results",
      // so the user gets the unavailable notice + browse fallback (via the catch below).
      if (stubs.length && !fetched.length) throw new Error('all result fragments failed');
      const items = fetched.filter((it) => safeRecipeUrl(it.url)).slice(0, MAX_RESULTS);
      renderResults(results, items);
      setVisible(true);
      announce(
        items.length
          ? `${items.length} result${items.length === 1 ? '' : 's'} for “${query}”`
          : `No recipes found for “${query}”`,
      );
    } catch {
      // No index (dev) or a transient load failure. Clear stale results so an old query's
      // cards can't linger under the new text, and say so (the <form> still submits to
      // /search/, and the browse fallback returns, as the non-JS path).
      results.replaceChildren();
      setVisible(false);
      if (fallback) fallback.hidden = false;
      announce('Search is unavailable right now — browse by category below.');
    }
  }

  input.addEventListener('input', () => {
    dismissed = false; // a fresh keystroke re-enables showing results
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => void run(input.value), 180);
  });
  // Lazy warm-up: kick off the Pagefind fetch the moment the user engages the box.
  input.addEventListener('focus', () => void loadPagefind().catch(() => {}), { once: true });

  if (dropdown) {
    // Fully dismiss the dropdown: cancel a pending debounced search and mark it dismissed so
    // a slow in-flight response can't reopen it. `refocus` returns focus to the input.
    const dismiss = (refocus: boolean) => {
      window.clearTimeout(debounce);
      dismissed = true;
      setVisible(false);
      if (refocus) input.focus();
    };
    document.addEventListener('click', (e) => {
      if (e.target !== input && !results.contains(e.target as Node)) dismiss(false);
    });
    // Escape from the input OR from within the results closes the panel; from the results
    // it also returns focus to the input.
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dismiss(false);
    });
    results.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dismiss(true);
    });
    // Close when focus tabs out of the search box + results entirely (keyboard users
    // tabbing past the last result shouldn't leave the panel floating over the page).
    if (container) {
      container.addEventListener('focusout', (e) => {
        const next = e.relatedTarget as Node | null;
        if (!next || !container.contains(next)) dismiss(false);
      });
    }
  }
}

// Header box (dropdown).
const headerInput = document.getElementById('site-search') as HTMLInputElement | null;
const headerResults = document.getElementById('site-search-results');
if (headerInput && headerResults) {
  wire(headerInput, headerResults, {
    dropdown: true,
    status: document.getElementById('site-search-status'),
  });
}

// /search/ page (inline results) — auto-run a deep-linked ?q= on page load.
const pageInput = document.getElementById('search-page-input') as HTMLInputElement | null;
const pageResults = document.getElementById('search-page-results');
if (pageInput && pageResults) {
  wire(pageInput, pageResults, {
    dropdown: false,
    status: document.getElementById('search-page-status'),
    fallback: document.getElementById('search-fallback'),
  });
  const q = new URLSearchParams(location.search).get('q');
  if (q) {
    // Hide the browse fallback up front so a deep-linked ?q= doesn't flash it during the
    // debounce + Pagefind load; run() manages it thereafter.
    document.getElementById('search-fallback')?.setAttribute('hidden', '');
    pageInput.value = q;
    pageInput.dispatchEvent(new Event('input'));
  }
}
