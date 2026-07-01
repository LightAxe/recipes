// Structured-data (JSON-LD) guard. Walks EVERY built page in dist/, parses every
// application/ld+json block, and validates it against a registered per-@type schema matched to
// src/lib/jsonld.ts. Two things make this scale with the collection (not a hand-maintained list):
//   1. Pages are discovered by walking dist/ — every current and future page is covered.
//   2. It HARD-FAILS on any top-level @type with no registered validator — so introducing a new
//      JSON-LD type without a matching check here can't slip through unvalidated.
// Runs after a build (needs dist/). Exit 1 on any malformed / incomplete / unregistered block.
import { readFile, readdir } from 'node:fs/promises';

const DIST = 'dist';
const failures = [];
const typeCounts = {};

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isUrl = (v) => isStr(v) && /^https?:\/\//.test(v);
const arr = (v) => Array.isArray(v) && v.length > 0;

// One validator per top-level @type we emit. Each returns an array of problem strings ([] = ok).
const VALIDATORS = {
  Recipe(o) {
    const p = [];
    if (!isStr(o.name)) p.push('name missing');
    if (!isStr(o.description)) p.push('description missing');
    if (!isStr(o.recipeCategory)) p.push('recipeCategory missing');
    if (!arr(o.recipeIngredient) || !o.recipeIngredient.every(isStr))
      p.push('recipeIngredient must be a non-empty string[]');
    if (!arr(o.recipeInstructions)) p.push('recipeInstructions must be a non-empty array');
    else if (
      !o.recipeInstructions.every((s) => s && s['@type'] === 'HowToStep' && isStr(s.text))
    )
      p.push('every recipeInstructions entry must be a HowToStep with text');
    return p;
  },
  BreadcrumbList(o) {
    const p = [];
    if (!arr(o.itemListElement)) return ['itemListElement must be a non-empty array'];
    o.itemListElement.forEach((li, i) => {
      if (!li || li['@type'] !== 'ListItem') p.push(`item ${i}: not a ListItem`);
      else {
        if (typeof li.position !== 'number') p.push(`item ${i}: position not a number`);
        if (!isStr(li.name)) p.push(`item ${i}: name missing`);
        // Google requires `item` (a URL) on EVERY entry — URL-less segments are dropped upstream.
        if (!isUrl(li.item)) p.push(`item ${i}: item must be an absolute URL`);
      }
    });
    // positions must be 1..n in order
    const pos = o.itemListElement.map((li) => li?.position);
    if (pos.some((n, i) => n !== i + 1))
      p.push(`positions must be 1..n in order (got ${pos})`);
    return p;
  },
  ItemList(o) {
    const p = [];
    if (!arr(o.itemListElement)) return ['itemListElement must be a non-empty array'];
    o.itemListElement.forEach((li, i) => {
      if (!li || li['@type'] !== 'ListItem') p.push(`item ${i}: not a ListItem`);
      else {
        if (typeof li.position !== 'number') p.push(`item ${i}: position not a number`);
        if (!isStr(li.name)) p.push(`item ${i}: name missing`);
        if (!isUrl(li.url)) p.push(`item ${i}: url must be an absolute URL`);
      }
    });
    const pos = o.itemListElement.map((li) => li?.position);
    if (pos.some((n, i) => n !== i + 1))
      p.push(`positions must be 1..n in order (got ${pos})`);
    return p;
  },
  Article(o) {
    const p = [];
    if (!isStr(o.headline)) p.push('headline missing');
    if (!isStr(o.description)) p.push('description missing');
    if (!isUrl(o.url)) p.push('url must be absolute');
    if (!isUrl(o.mainEntityOfPage)) p.push('mainEntityOfPage must be absolute');
    return p;
  },
  AboutPage(o) {
    const p = [];
    if (!isStr(o.name)) p.push('name missing');
    if (!isStr(o.description)) p.push('description missing');
    if (!isUrl(o.url)) p.push('url must be absolute');
    return p;
  },
  WebSite(o) {
    const p = [];
    if (!isStr(o.name)) p.push('name missing');
    if (!isUrl(o.url)) p.push('url must be absolute');
    const a = o.potentialAction;
    if (!a || a['@type'] !== 'SearchAction' || !a.target || !isStr(a.target.urlTemplate))
      p.push('potentialAction must be a SearchAction with target.urlTemplate');
    return p;
  },
};

async function* htmlFiles(dir) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const full = `${dir}/${ent.name}`;
    if (ent.isDirectory()) yield* htmlFiles(full);
    else if (ent.name.endsWith('.html')) yield full;
  }
}

let pages = 0;
let blocks = 0;
let recipePages = 0; // pages at /recipes/<slug>/ — each must carry exactly one Recipe block
for await (const file of htmlFiles(DIST)) {
  pages++;
  const html = await readFile(file, 'utf8');
  const rel = file.replace(`${DIST}/`, '/').replace(/\/index\.html$/, '/');
  const isRecipePage = /^\/recipes\/[^/]+\/$/.test(rel);
  if (isRecipePage) recipePages++;
  let pageRecipeBlocks = 0; // Recipe blocks on THIS page (checked per-page, not just in aggregate)
  for (const block of html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) ||
    []) {
    blocks++;
    const body = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    let obj;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      failures.push(`${rel}: JSON-LD does not parse — ${e.message}`);
      continue;
    }
    if (!obj || typeof obj !== 'object') {
      failures.push(`${rel}: JSON-LD block is not an object (got ${JSON.stringify(obj)})`);
      continue;
    }
    const type = obj['@type'];
    if (type === 'Recipe') pageRecipeBlocks++;
    // schema.org is the only @context we emit — a wrong domain breaks rich results silently.
    if (obj['@context'] !== 'https://schema.org')
      failures.push(
        `${rel}: [${type}] @context must be "https://schema.org" (got ${obj['@context']})`,
      );
    const validate = VALIDATORS[type];
    if (!validate) {
      // The core guarantee: a new/unknown top-level type must get a validator here.
      failures.push(
        `${rel}: unregistered top-level @type "${type}" — add a validator to jsonld-audit.mjs`,
      );
      continue;
    }
    typeCounts[type] = (typeCounts[type] || 0) + 1;
    for (const problem of validate(obj)) failures.push(`${rel}: [${type}] ${problem}`);
  }
  // Per-page (not aggregate): every recipe page carries exactly one Recipe block. An aggregate
  // total would let a page with two Recipe blocks mask another page that emits none.
  if (isRecipePage && pageRecipeBlocks !== 1)
    failures.push(
      `${rel}: expected exactly 1 Recipe JSON-LD block, found ${pageRecipeBlocks}`,
    );
}

console.log(
  `jsonld-audit: ${pages} pages, ${blocks} JSON-LD blocks — ` +
    Object.entries(typeCounts)
      .map(([t, n]) => `${t}×${n}`)
      .join(', '),
);
// Non-vacuity: an empty/partial dist/, or a build that stopped emitting JSON-LD, must FAIL —
// not silently "pass" with zero blocks. (The per-page Recipe check above covers dropped blocks.)
if (blocks === 0)
  failures.push('no JSON-LD blocks found in dist/ — build empty or emitting none?');
if (recipePages === 0)
  failures.push('no /recipes/<slug>/ pages found in dist/ — build broken?');
if (failures.length) {
  console.error(`\nJSON-LD AUDIT FAILED: ${failures.length} problem(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(
  'JSON-LD AUDIT PASSED: every block is well-formed, complete, and a registered type.',
);
