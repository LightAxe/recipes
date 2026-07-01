// /recipes/ faceted filter (progressive enhancement). The page server-renders the full
// A–Z grid; this reveals the filter panel and filters/sorts the already-rendered cards in
// place. Semantics: OR within an axis, AND across axes. State lives in the URL as repeated
// params (?course=dessert&tag=apple&tag=pecan&sort=newest), values sorted for a canonical,
// shareable URL; Back/Forward re-apply via popstate.
const AXES = ['course', 'cuisine', 'from', 'tag'] as const;
type Axis = (typeof AXES)[number];
type State = Record<Axis, string[]>;
type Sort = 'az' | 'newest';

// Defensive cap so a hostile deep-link with thousands of repeated params can't make the
// one-shot apply() do unbounded work (there are only ~a dozen real values per axis).
const MAX_SELECTED = 64;

const form = document.getElementById('facets') as HTMLFormElement | null;
const grid = document.getElementById('recipe-grid');
const countEl = document.getElementById('recipe-count');
const noMatch = document.getElementById('no-match');
const sortSel = document.getElementById('sort') as HTMLSelectElement | null;

if (form && grid && countEl) {
  const cards = Array.from(grid.querySelectorAll<HTMLLIElement>('li'));
  const total = Number(countEl.dataset.total) || cards.length;
  const checkboxes = Array.from(
    form.querySelectorAll<HTMLInputElement>('input[type=checkbox]'),
  );
  const emptyState = (): State => ({ course: [], cuisine: [], from: [], tag: [] });

  const cardValues = (card: HTMLElement, axis: Axis): string[] => {
    if (axis === 'tag') return (card.dataset.tags || '').split(' ').filter(Boolean);
    const v = card.dataset[axis] || '';
    return v ? [v] : [];
  };

  function readURL(): { state: State; sort: Sort } {
    const p = new URLSearchParams(location.search);
    const state = emptyState();
    for (const axis of AXES)
      state[axis] = p.getAll(axis).filter(Boolean).slice(0, MAX_SELECTED);
    return { state, sort: p.get('sort') === 'newest' ? 'newest' : 'az' };
  }

  function writeURL(state: State, sort: Sort, push: boolean): void {
    const p = new URLSearchParams();
    for (const axis of AXES) [...state[axis]].sort().forEach((v) => p.append(axis, v));
    if (sort === 'newest') p.set('sort', 'newest');
    const qs = p.toString();
    const url = location.pathname + (qs ? `?${qs}` : '');
    if (push) history.pushState(null, '', url);
    else history.replaceState(null, '', url);
  }

  function stateFromUI(): { state: State; sort: Sort } {
    const state = emptyState();
    for (const cb of checkboxes) if (cb.checked) state[cb.dataset.axis as Axis].push(cb.value);
    return { state, sort: sortSel?.value === 'newest' ? 'newest' : 'az' };
  }

  function apply(state: State, sort: Sort): void {
    for (const cb of checkboxes) {
      cb.checked = state[cb.dataset.axis as Axis].includes(cb.value);
    }
    if (sortSel) sortSel.value = sort;

    const ordered = [...cards].sort((a, b) => {
      if (sort === 'newest') {
        const d = Number(b.dataset.date) - Number(a.dataset.date);
        if (d) return d;
      }
      return (a.dataset.title || '').localeCompare(b.dataset.title || '');
    });
    for (const c of ordered) grid!.appendChild(c);

    let visible = 0;
    for (const card of cards) {
      const show = AXES.every((axis) => {
        const sel = state[axis];
        if (!sel.length) return true;
        const vals = cardValues(card, axis);
        return sel.some((v) => vals.includes(v));
      });
      card.hidden = !show;
      if (show) visible++;
    }
    const plural = (n: number) => `${n} recipe${n === 1 ? '' : 's'}`;
    const label = visible === total ? plural(total) : `${visible} of ${plural(total)}`;
    // Only touch the live region when the text actually changes, so the initial (no-filter)
    // apply() on load doesn't fire a spurious "N recipes" announcement.
    if (countEl!.textContent?.trim() !== label) countEl!.textContent = label;
    if (noMatch) noMatch.hidden = visible !== 0;
  }

  function reset(): void {
    const empty = emptyState();
    writeURL(empty, 'az', true);
    apply(empty, 'az');
    // The #no-match-reset button lives inside #no-match, which apply() just hid — move
    // focus to the always-present filter Reset so keyboard/SR focus isn't lost to <body>.
    document.getElementById('facet-reset')?.focus();
  }

  form.addEventListener('change', () => {
    const { state, sort } = stateFromUI();
    writeURL(state, sort, true);
    apply(state, sort);
  });
  document.getElementById('facet-reset')?.addEventListener('click', reset);
  document.getElementById('no-match-reset')?.addEventListener('click', reset);
  window.addEventListener('popstate', () => {
    const { state, sort } = readURL();
    apply(state, sort);
  });

  // Hydrate from a deep-linked / shared URL on load, then rewrite it in canonical form
  // (sorted params) so a link built by hand and one built by the UI always match.
  const initial = readURL();
  apply(initial.state, initial.sort);
  writeURL(initial.state, initial.sort, false);
  // Reveal the panel only after the grid is already filtered, so a deep-linked filter URL
  // never flashes the full grid alongside an exposed (empty-looking) filter panel.
  form.hidden = false;
}
