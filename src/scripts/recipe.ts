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
  const base = Number(controls.dataset.baseServings) || 1;
  const slug = controls.dataset.slug || 'recipe';
  const weightEligible = controls.dataset.weightEligible === '1';

  const amounts = Array.from(document.querySelectorAll<HTMLElement>('.amount'));
  const servingsInput = document.getElementById('servings-input') as HTMLInputElement | null;
  const presets = Array.from(controls.querySelectorAll<HTMLButtonElement>('[data-scale]'));
  const sysBtn = document.getElementById('u-system') as HTMLButtonElement | null;
  const measBtn = document.getElementById('u-measure') as HTMLButtonElement | null;

  const prefs = loadPrefs();
  let system: System = prefs.system;
  // "prefer weight" = the saved measure pref, but only when this recipe supports it.
  let measure: Measure = weightEligible ? prefs.measure : 'volume';

  // Scale precedence: URL ?servings= → base.
  const urlServings = Number(new URLSearchParams(location.search).get('servings'));
  let factor = clampFactor((urlServings && urlServings > 0 ? urlServings : base) / base);
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
    for (const p of presets) {
      const active = Math.abs(Number(p.dataset.scale) - factor) < 1e-9;
      p.setAttribute('aria-checked', String(active));
      p.classList.toggle('active', active);
    }
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
  sysBtn?.addEventListener('click', () => {
    system = system === 'us' ? 'metric' : 'us';
    savePrefs({ system, measure });
    render();
  });
  measBtn?.addEventListener('click', () => {
    measure = measure === 'weight' ? 'volume' : 'weight';
    savePrefs({ system, measure });
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
      const cleanup = () => {
        document.body.classList.remove('print-full', 'print-card');
        if (pageCard) pageCard.media = 'not all';
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
    });
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

  async function acquire() {
    const wl = (navigator as any).wakeLock;
    if (!wl || sentinel) return;
    try {
      const s = await wl.request('screen');
      if (!want) {
        // toggled off while the request was in flight — drop it (Codex: stale acquire)
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
        sentinel = null; // reset so visibilitychange can reacquire (Codex)
        if (status) status.hidden = true;
      });
    } catch {
      if (status) status.hidden = true; // unsupported / denied: degrade quietly
    }
  }
  async function releaseLock() {
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
