// Progressive enhancement for the header's native <details> menus — the Categories
// dropdown and the mobile hamburger. Native disclosure already works with no JS; this adds
// close on Escape (returning focus to that menu's summary), on an outside click, and when
// focus tabs out of the menu. One set of document-level listeners handles both menus (no
// duplicate registrations).
const menus = ['cats-menu', 'mobile-menu']
  .map((id) => document.getElementById(id))
  .filter((el): el is HTMLDetailsElement => el instanceof HTMLDetailsElement);

if (menus.length) {
  document.addEventListener('click', (e) => {
    for (const m of menus) {
      if (m.open && !m.contains(e.target as Node)) m.open = false;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    for (const m of menus) {
      if (!m.open) continue;
      m.open = false;
      // Only return focus to a *visible* summary — a menu orphaned open by a viewport resize
      // across the breakpoint is display:none, so focusing its summary would just drop to body.
      if (m.offsetParent !== null) m.querySelector('summary')?.focus();
    }
  });
  for (const m of menus) {
    m.addEventListener('focusout', (e) => {
      // Close only when focus genuinely lands OUTSIDE the menu (keyboard tab-out) — i.e. there's
      // a real relatedTarget. A NULL relatedTarget must NOT close: Safari/WebKit doesn't focus
      // <a>/<button> on click (macOS convention), so clicking a menu link blurs the summary with
      // relatedTarget=null; closing here would tear the <details> down mid-mousedown and the link
      // click would never navigate (it selects text instead). Click-away is handled by the
      // document click listener above, so nothing regresses.
      const next = e.relatedTarget as Node | null;
      if (m.open && next && !m.contains(next)) m.open = false;
    });
  }
}
