// Recipe-page interactivity (progressive enhancement). Reads data-* attributes,
// computes display via the pure lib, persists state. No-JS path is unaffected.
import { amountFor, type System, type Measure } from '../lib/units';
import { clampFactor } from '../lib/scaling';

interface Prefs {
  system: System;
  measure: Measure;
}
const PREFS_KEY = 'ofr:prefs';

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return {
      system: p.system === 'metric' ? 'metric' : 'us',
      measure: p.measure === 'weight' ? 'weight' : 'volume',
    };
  } catch {
    return { system: 'us', measure: 'volume' };
  }
}
function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
const numOr = (s?: string) => (s ? Number(s) : undefined);

function init(controls: HTMLElement) {
  // Recipes without a `servings` number (e.g. yield-only canning recipes) get no scaler
  // and must NOT be scaled by a stray ?servings= in the URL — guard on a real base.
  const hasBase = Number(controls.dataset.baseServings) > 0;
  const base = hasBase ? Number(controls.dataset.baseServings) : 1;
  const slug = controls.dataset.slug || 'recipe';
  const weightEligible = controls.dataset.weightEligible === '1';

  const amounts = Array.from(document.querySelectorAll<HTMLElement>('.amount'));
  const servingsInput = document.getElementById('servings-input') as HTMLInputElement | null;
  const presets = Array.from(controls.querySelectorAll<HTMLButtonElement>('[data-scale]'));
  const sysBtn = document.getElementById('u-system') as HTMLButtonElement | null;
  const measBtn = document.getElementById('u-measure') as HTMLButtonElement | null;
  const servesEl = document.getElementById('serves-count');
  const yieldEl = document.getElementById('yield-note');

  const prefs = loadPrefs();
  let system: System = prefs.system;
  // Keep the *global* weight preference separate from what this recipe can display.
  // `storedMeasure` is what we persist; `measure` is the gated view (forced to volume
  // when this recipe lacks enough gram data). This prevents a US/metric toggle on a
  // weight-ineligible recipe from silently clobbering the saved "prefer weight" pref.
  let storedMeasure: Measure = prefs.measure;
  let measure: Measure = weightEligible ? storedMeasure : 'volume';

  // Scale precedence: URL ?servings= → base (only honored when the recipe has a base).
  const urlServings = Number(new URLSearchParams(location.search).get('servings'));
  let factor = clampFactor((hasBase && urlServings > 0 ? urlServings : base) / base);
  let servings = Math.round(factor * base * 100) / 100;

  function render() {
    for (const el of amounts) {
      const ing = {
        qty: numOr(el.dataset.qty),
        unit: el.dataset.unit || undefined,
        grams: numOr(el.dataset.grams),
        gramsApprox: el.dataset.gramsApprox === '1',
      };
      if (ing.qty == null && ing.grams == null) continue;
      const { text, approx } = amountFor(ing, { system, measure, factor });
      el.textContent = approx ? `≈ ${text}` : text;
    }
    if (servingsInput) servingsInput.value = String(servings);
    if (servesEl) servesEl.textContent = String(servings); // keep header in sync (prints too)
    // base yield is only valid at ×1 — hide it once scaled so prints aren't misleading
    if (yieldEl) yieldEl.hidden = Math.abs(factor - 1) > 1e-9;
    // Roving tabindex: only the checked radio is in the tab order (ARIA radiogroup). If the
    // current factor matches no preset (custom servings), keep the first one tabbable so the
    // group stays keyboard-reachable.
    let anyActive = false;
    for (const p of presets) {
      const active = Math.abs(Number(p.dataset.scale) - factor) < 1e-9;
      p.setAttribute('aria-checked', String(active));
      p.classList.toggle('active', active);
      p.tabIndex = active ? 0 : -1;
      if (active) anyActive = true;
    }
    if (!anyActive && presets[0]) presets[0].tabIndex = 0;
    if (sysBtn) {
      sysBtn.textContent = system === 'us' ? 'US' : 'Metric';
      sysBtn.setAttribute(
        'aria-label',
        `Switch to ${system === 'us' ? 'metric' : 'US'} units`,
      );
    }
    if (measBtn) {
      measBtn.textContent = measure === 'weight' ? 'Weight' : 'Volume';
      measBtn.setAttribute(
        'aria-label',
        `Switch to ${measure === 'weight' ? 'volume' : 'weight'}`,
      );
    }
  }

  function setServings(n: number) {
    factor = clampFactor((n || base) / base);
    servings = Math.round(factor * base * 100) / 100;
    const u = new URL(location.href);
    if (Math.abs(factor - 1) < 1e-9) u.searchParams.delete('servings');
    else u.searchParams.set('servings', String(servings));
    history.replaceState(null, '', u);
    render();
  }

  servingsInput?.addEventListener('change', () => setServings(Number(servingsInput.value)));
  for (const p of presets)
    p.addEventListener('click', () => setServings(base * Number(p.dataset.scale)));
  // Arrow keys move + select within the radiogroup (ARIA radio pattern).
  const radiogroup = controls.querySelector<HTMLElement>('[role="radiogroup"]');
  radiogroup?.addEventListener('keydown', (e) => {
    const idx = presets.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % presets.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
      next = (idx - 1 + presets.length) % presets.length;
    if (next < 0) return;
    e.preventDefault();
    const btn = presets[next];
    setServings(base * Number(btn.dataset.scale));
    btn.focus();
  });
  sysBtn?.addEventListener('click', () => {
    system = system === 'us' ? 'metric' : 'us';
    // Persist the global weight pref untouched (don't write the gated view).
    savePrefs({ system, measure: storedMeasure });
    render();
  });
  measBtn?.addEventListener('click', () => {
    measure = measure === 'weight' ? 'volume' : 'weight';
    storedMeasure = measure;
    savePrefs({ system, measure: storedMeasure });
    render();
  });

  wireChecklist(slug);
  wireCookMode();
  wirePrint();

  controls.hidden = false;
  render();
}

// ── Print menu: clean (default) / full (photo) / 4×6 card ────────────────────
function wirePrint() {
  const menu = document.querySelector<HTMLDetailsElement>('.print-menu');
  if (!menu) return;
  const pageCard = document.getElementById('print-page-card') as HTMLStyleElement | null;
  menu.querySelectorAll<HTMLButtonElement>('[data-print]').forEach((b) => {
    b.addEventListener('click', () => {
      const mode = b.dataset.print;
      document.body.classList.remove('print-full', 'print-card');
      if (mode === 'full') document.body.classList.add('print-full');
      if (mode === 'card') {
        document.body.classList.add('print-card');
        if (pageCard) pageCard.media = 'print';
      }
      menu.open = false;
      menu.querySelector('summary')?.focus(); // keep focus on the visible trigger, not <body>
      const cleanup = () => {
        document.body.classList.remove('print-full', 'print-card');
        if (pageCard) pageCard.media = 'not all';
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
    });
  });
  // Dismiss the menu on Escape / when focus tabs out (parity with the Categories menu),
  // so an open, absolutely-positioned panel never lingers over the controls after focus moves.
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus(); // return focus, don't drop it to <body>
    }
  });
  // Close on an outside click (the print options are <button>s, and Safari/WebKit doesn't focus
  // buttons on click — so we can't rely on focusout alone, and mustn't: a null-relatedTarget
  // focusout close would tear the menu down mid-mousedown and the print click would never fire).
  document.addEventListener('click', (e) => {
    if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
  });
  menu.addEventListener('focusout', (e) => {
    // Only on a real relatedTarget outside the menu (keyboard tab-out). Null relatedTarget (a
    // WebKit button/link click inside) must not close — outside clicks are handled above.
    const next = e.relatedTarget as Node | null;
    if (menu.open && next && !menu.contains(next)) menu.open = false;
  });
}

// ── Tap-to-check, persisted per recipe ──────────────────────────────────────
function wireChecklist(slug: string) {
  const boxes = Array.from(document.querySelectorAll<HTMLInputElement>('.check'));
  boxes.forEach((box, i) => {
    const key = `ofr:check:${slug}:${i}`;
    try {
      if (localStorage.getItem(key) === '1') box.checked = true;
    } catch {
      /* ignore */
    }
    box.addEventListener('change', () => {
      try {
        if (box.checked) localStorage.setItem(key, '1');
        else localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    });
  });
}

// ── Lightweight cook mode + Screen Wake Lock ────────────────────────────────
function wireCookMode() {
  const btn = document.getElementById('cookmode-btn') as HTMLButtonElement | null;
  const status = document.getElementById('cookmode-status');
  if (!btn) return;
  let sentinel: any = null;
  let want = false; // cook mode on → we want the lock held
  let token = 0; // serializes acquisitions; bumped on every release/disable

  async function acquire() {
    const wl = (navigator as any).wakeLock;
    if (!wl || sentinel) return;
    const my = ++token;
    try {
      const s = await wl.request('screen');
      if (!want || my !== token) {
        // toggled off, or superseded by a newer acquire (on→off→on) — drop this one.
        try {
          await s.release();
        } catch {
          /* ignore */
        }
        return;
      }
      sentinel = s;
      if (status) status.hidden = false; // status only after a live sentinel
      s.addEventListener?.('release', () => {
        if (sentinel !== s) return; // a superseded sentinel released — don't clobber the current one
        sentinel = null; // reset so visibilitychange can reacquire
        if (status) status.hidden = true;
      });
    } catch {
      if (status) status.hidden = true; // unsupported / denied: degrade quietly
    }
  }
  async function releaseLock() {
    token++; // invalidate any in-flight acquire
    const s = sentinel;
    sentinel = null;
    if (status) status.hidden = true;
    try {
      await s?.release?.();
    } catch {
      /* ignore */
    }
  }

  btn.addEventListener('click', () => {
    want = document.body.classList.toggle('cook-mode');
    btn.setAttribute('aria-pressed', String(want));
    if (want) acquire();
    else releaseLock();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && want && !sentinel) acquire();
  });
}

// Bootstrap last — after all module-level const/function declarations are initialized
// (calling init() at the top would hit the TDZ for PREFS_KEY/numOr).
const controlsEl = document.getElementById('controls');
if (controlsEl) init(controlsEl);
