// Site-wide search island (header dropdown + the /search/ page both use it). Pagefind is
// **lazy-loaded** — its WASM + index are fetched on first focus/keystroke, never on page load —
// so idle pages keep their performance budget. The /search/ page additionally supports a
// deep-linked ?q=…&course=… , auto-run on load, and a course FILTER plane (#13).
//
// Security: Pagefind result metadata derives from recipe frontmatter and is untrusted client
// data. Titles/meta are written with textContent (never innerHTML); only Pagefind's own
// `excerpt` (escaped text + <mark>) uses innerHTML; a result URL must match ^/recipes/ before
// it can become an href; and course filter values are whitelisted against the rendered checkboxes.

type PagefindMeta = {
  title?: unknown;
  course?: unknown;
  time?: unknown;
  serves?: unknown;
  image?: unknown;
  image_alt?: unknown;
};
type PagefindResultData = { url?: unknown; excerpt?: unknown; meta?: PagefindMeta };
type PagefindSearch = {
  results: { data: () => Promise<PagefindResultData> }[];
  // Per-filter-value counts for the current query, as if THIS filter weren't applied — used for
  // the checkbox counts so selecting one course doesn't zero the others.
  totalFilters?: { course?: Record<string, number> } | null;
};
type SearchOpts = { filters?: { course?: { any: string[] } } };
type PagefindModule = {
  search: (q: string | null, opts?: SearchOpts) => Promise<PagefindSearch>;
  // Must be awaited once before totalFilters counts are reliable.
  filters?: () => Promise<Record<string, Record<string, number>>>;
};

let pfPromise: Promise<PagefindModule> | null = null;
function loadPagefind(): Promise<PagefindModule> {
  if (!pfPromise) {
    // Non-literal specifier (typed `string`, not a literal) + @vite-ignore so neither TS nor the
    // bundler tries to resolve the generated index at build time (it only exists in dist/).
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

    // Richer card (#13): a `time · serves` line (display-ready meta from the recipe article).
    // The hero-image slot is intentionally not rendered yet — no recipe ships a photo.
    const time = text(it.meta?.time);
    const serves = text(it.meta?.serves);
    if (time || serves) {
      const m = document.createElement('p');
      m.className = 'sr-meta';
      m.textContent = [time, serves].filter(Boolean).join(' · ');
      a.append(m);
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

const DROPDOWN_MAX = 8;
const PAGE_MAX = 60; // the /search/ page shows the full result set (counts must not contradict it)
const FETCH_MULTIPLIER = 4; // over-fetch window so the recipe-URL filter can run before capping
const MAX_COURSES = 64; // defensive cap on selected filter values (hostile deep-links)

interface WireOpts {
  dropdown: boolean;
  /** Visually-hidden aria-live region — announces the result count to screen readers. */
  status?: HTMLElement | null;
  /** Browse-fallback block (on /search/) — hidden while a query is active. */
  fallback?: HTMLElement | null;
  /** Course filter <fieldset> (server-rendered, /search/ only). */
  filterPanel?: HTMLElement | null;
  /** Render cap (dropdown 8, page 60). */
  max?: number;
}

function wire(input: HTMLInputElement, results: HTMLElement, opts: WireOpts): void {
  const { dropdown, status = null, fallback = null, filterPanel = null } = opts;
  const max = opts.max ?? DROPDOWN_MAX;
  const isPage = !dropdown;
  const container = input.closest('form') ?? input.parentElement;
  let debounce = 0;
  // Monotonic request id: every run() captures the current token; after each await it re-checks
  // it and bails if a newer run (new query OR new filter selection) has started. Replaces the
  // old lastQuery-only guard, which couldn't tell two same-query/different-filter runs apart.
  let token = 0;
  // True once the dropdown is closed (Esc / outside-click / tab-out); an in-flight response then
  // drops itself instead of reopening. Reset on the next keystroke. (Dropdown only.)
  let dismissed = false;

  const courseBoxes = filterPanel
    ? Array.from(
      filterPanel.querySelectorAll<HTMLInputElement>('input[type=checkbox][name="course"]'),
    )
    : [];
  const knownSlugs = new Set(courseBoxes.map((b) => b.value)); // whitelist for URL hardening
  const clearBtn = filterPanel?.querySelector<HTMLButtonElement>('[data-clear]') ?? null;
  const checkedCourses = () => courseBoxes.filter((b) => b.checked).map((b) => b.value);

  const announce = (msg: string) => {
    if (status) status.textContent = msg;
  };
  const setVisible = (visible: boolean) => {
    results.hidden = !visible;
  };
  const focusInside = () => {
    const a = document.activeElement;
    return !!a && (a === input || (!!container && container.contains(a)));
  };

  // ── URL state (page only): ?q=…&course=…&course=… , repeated params, canonical-sorted ──
  function writeURL(push: boolean): void {
    if (!isPage) return;
    const p = new URLSearchParams();
    const q = input.value.trim();
    if (q) {
      p.set('q', q);
      // Refine-only: course params are meaningful only alongside a query. checkedCourses()
      // returns a fresh array, so sorting it in place is safe.
      checkedCourses()
        .sort()
        .forEach((c) => p.append('course', c));
    }
    const qs = p.toString();
    const url = location.pathname + (qs ? `?${qs}` : '');
    history[push ? 'pushState' : 'replaceState'](null, '', url);
  }
  function readURL(): { q: string; courses: string[] } {
    const p = new URLSearchParams(location.search);
    const q = p.get('q') ?? '';
    // Whitelist against rendered checkboxes, cap, and ignore entirely when q is empty.
    const courses = q
      ? p
        .getAll('course')
        .filter((c) => knownSlugs.has(c))
        .slice(0, MAX_COURSES)
      : [];
    return { q, courses };
  }
  // Reflect a set of checked courses onto the checkboxes (used by deep-link + popstate).
  function setChecked(courses: string[]): void {
    const set = new Set(courses);
    for (const b of courseBoxes) b.checked = set.has(b.value);
  }

  // Update the filter plane's per-course counts + which checkboxes show, from the query's
  // unfiltered per-course distribution. A checked course with count 0 stays visible (so it can
  // be unchecked); an unchecked course with count 0 is hidden (no noise).
  function updateFilterUI(counts: Record<string, number> | null): void {
    if (!filterPanel) return;
    const checked = new Set(checkedCourses());
    for (const b of courseBoxes) {
      const n = counts?.[b.value] ?? 0;
      const row = b.closest('li') ?? b.parentElement;
      const hide = !(n > 0 || checked.has(b.value));
      // Hiding a row that holds keyboard focus (unchecking a checked course whose count just
      // dropped to 0) would drop focus to <body> — same class as the hidePanel case. Reseat first.
      if (row && hide && row.contains(document.activeElement)) input.focus();
      if (row) (row as HTMLElement).hidden = hide;
      const countEl = row?.querySelector('.cf-count');
      if (countEl) countEl.textContent = `(${n})`;
    }
    if (clearBtn) clearBtn.hidden = checked.size === 0;
  }

  // Hide the filter plane, moving focus back to the input first if it was inside the fieldset —
  // otherwise a plane that hides while a checkbox is focused (no-match query, or popstate) would
  // drop focus to <body>. (The Clear button handles its own focus separately.)
  function hidePanel(): void {
    if (!filterPanel) return;
    if (filterPanel.contains(document.activeElement)) input.focus();
    filterPanel.hidden = true;
  }

  async function run(): Promise<void> {
    const query = input.value.trim();
    const my = ++token;
    if (!query) {
      results.replaceChildren();
      setVisible(false);
      if (fallback) fallback.hidden = false; // no query → offer the browse fallback
      // writeURL drops `course` when q is empty, so clear the checkboxes too — otherwise stale
      // checks silently resurrect filters the URL no longer carries on the next keystroke.
      if (isPage) setChecked([]);
      hidePanel(); // nothing to filter
      announce('');
      return;
    }
    if (fallback) fallback.hidden = true;
    try {
      const pf = await loadPagefind();
      if (my !== token) return;
      // Filter counts need the filter index loaded once before totalFilters is reliable.
      if (filterPanel && pf.filters) await pf.filters();
      if (my !== token) return;

      const courses = isPage ? checkedCourses() : [];
      const search = await pf.search(
        query,
        courses.length ? { filters: { course: { any: courses } } } : undefined,
      );
      if (my !== token) return; // superseded by a newer query/filter
      if (dropdown && (dismissed || !focusInside())) return;

      const total = search.results.length;
      const windowed = search.results.slice(0, max * FETCH_MULTIPLIER);
      // Fail-soft: one fragment's data() rejecting must not sink the whole query.
      const settled = await Promise.allSettled(windowed.map((r) => r.data()));
      if (my !== token) return;
      if (dropdown && (dismissed || !focusInside())) return;
      const fetched = settled
        .filter(
          (s): s is PromiseFulfilledResult<PagefindResultData> => s.status === 'fulfilled',
        )
        .map((s) => s.value);
      if (windowed.length && !fetched.length) throw new Error('all result fragments failed');
      const items = fetched.filter((it) => safeRecipeUrl(it.url)).slice(0, max);
      renderResults(results, items);
      setVisible(true);

      if (filterPanel) {
        // Counts = the query's UNFILTERED per-course distribution. Pagefind's `totalFilters` gives
        // this even on a filtered search (verified: it reports counts as if THIS filter weren't
        // applied), so no companion search is needed — selecting one course doesn't zero the rest.
        const counts = search.totalFilters?.course ?? null;
        // Visibility predicate (PLAN.md): show iff the query has any unfiltered matches. A no-match
        // query hides the plane (no empty shell); a filtered-to-zero query still shows it (other
        // courses have counts) so the user can uncheck. Then paint counts + per-row visibility.
        const hasMatches = !!counts && Object.values(counts).some((n) => n > 0);
        if (hasMatches) {
          filterPanel.hidden = false;
          updateFilterUI(counts);
        } else {
          hidePanel();
        }
      }

      const shown = items.length;
      const scope = courses.length
        ? ` in ${courses.length} categor${courses.length === 1 ? 'y' : 'ies'}`
        : '';
      announce(
        shown
          ? `Showing ${shown}${total > shown ? ` of ${total}` : ''} result${total === 1 ? '' : 's'} for “${query}”${scope}`
          : `No recipes found for “${query}”${courses.length ? ' with those filters' : ''}`,
      );
    } catch {
      // A superseded run's late rejection (e.g. a per-query index-chunk fetch failing on a flaky
      // network) must NOT clobber a newer run's rendered results — same invariant the success path
      // holds after every await. Bail before touching the DOM.
      if (my !== token) return;
      if (dropdown && (dismissed || !focusInside())) return;
      // No index (dev) or a transient load failure. Clear stale results + say so; the <form>
      // still submits to /search/ and the browse fallback returns (the non-JS path).
      results.replaceChildren();
      setVisible(false);
      if (fallback) fallback.hidden = false;
      hidePanel();
      announce('Search is unavailable right now — browse by category below.');
    }
  }

  input.addEventListener('input', () => {
    dismissed = false; // a fresh keystroke re-enables showing results
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      writeURL(false); // typing → canonicalize the URL without spamming history
      void run();
    }, 180);
  });
  input.addEventListener('focus', () => void loadPagefind().catch(() => { }), { once: true });

  // ── /search/ page: course filter wiring + URL history ── (gated on isPage, not filterPanel,
  // so a plain ?q= deep-link + popstate still work even if the filter fieldset weren't rendered)
  if (isPage) {
    filterPanel?.addEventListener('change', () => {
      writeURL(true); // a discrete filter toggle → a history entry (Back steps through it)
      void run();
    });
    clearBtn?.addEventListener('click', () => {
      setChecked([]);
      writeURL(true);
      void run();
      input.focus(); // Clear lives in the plane; keep focus in the search UI, not <body>
    });
    window.addEventListener('popstate', () => {
      const { q, courses } = readURL();
      input.value = q;
      setChecked(courses);
      void run(); // re-apply without pushing a new entry
    });
    // The course checkboxes live OUTSIDE the GET form, so a native submit (Enter / the Search
    // button) would reload to ?q=… and drop them. With JS the results are already live, so cancel
    // the submit and just re-run — the URL already carries q + course via writeURL.
    input.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      window.clearTimeout(debounce); // don't let a pending debounced run() fire a duplicate
      writeURL(false);
      void run();
    });
    // Deep-link / shared URL: hydrate q + course checkboxes, canonicalize, run — one apply path
    // shared with popstate (readURL/setChecked), so initial load and Back never diverge. (run()
    // hides the fallback before its first await, so no separate fallback toggle is needed here.)
    const initial = readURL();
    if (initial.q) {
      input.value = initial.q;
      setChecked(initial.courses);
      writeURL(false);
      void run();
    } else if (location.search) {
      writeURL(false);
    }
  }

  if (dropdown) {
    const dismiss = (refocus: boolean) => {
      window.clearTimeout(debounce);
      dismissed = true;
      setVisible(false);
      if (refocus) input.focus();
    };
    document.addEventListener('click', (e) => {
      if (e.target !== input && !results.contains(e.target as Node)) dismiss(false);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dismiss(false);
    });
    results.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dismiss(true);
    });
    // Close only on a REAL relatedTarget outside the panel (keyboard tab-out). A null
    // relatedTarget must not dismiss — Safari doesn't focus <a> on click, so a result click blurs
    // the input with relatedTarget=null and dismissing would kill the navigation. (See PR #30.)
    if (container) {
      container.addEventListener('focusout', (e) => {
        const next = e.relatedTarget as Node | null;
        if (next && !container.contains(next)) dismiss(false);
      });
    }
  }
}

// Header box (dropdown) — no filter plane, compact cap.
const headerInput = document.getElementById('site-search') as HTMLInputElement | null;
const headerResults = document.getElementById('site-search-results');
if (headerInput && headerResults) {
  wire(headerInput, headerResults, {
    dropdown: true,
    status: document.getElementById('site-search-status'),
  });
}

// /search/ page (inline results + course filter). Deep-link hydration lives inside wire()'s
// page branch (one apply path shared with popstate).
const pageInput = document.getElementById('search-page-input') as HTMLInputElement | null;
const pageResults = document.getElementById('search-page-results');
if (pageInput && pageResults) {
  wire(pageInput, pageResults, {
    dropdown: false,
    status: document.getElementById('search-page-status'),
    fallback: document.getElementById('search-fallback'),
    filterPanel: document.getElementById('course-filter'),
    max: PAGE_MAX,
  });
}
