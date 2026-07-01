// Progressive enhancement for the Categories <details> dropdown. The menu already
// works with no JS (native disclosure); this just adds the niceties: close on Escape
// (returning focus to the summary) and on an outside click.
const cats = document.getElementById('cats-menu') as HTMLDetailsElement | null;
if (cats) {
  document.addEventListener('click', (e) => {
    if (cats.open && !cats.contains(e.target as Node)) cats.open = false;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cats.open) {
      cats.open = false;
      cats.querySelector('summary')?.focus();
    }
  });
  // Close when keyboard focus tabs out of the menu entirely (not just on Esc), so an open
  // panel never floats over the page after focus has moved elsewhere.
  cats.addEventListener('focusout', (e) => {
    const next = e.relatedTarget as Node | null;
    if (cats.open && (!next || !cats.contains(next))) cats.open = false;
  });
}
