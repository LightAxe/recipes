# Designing a Cross-Generational Family Recipe Website — Research & Best Practices

_Compiled 2026-06-29. Audience: a family recipe site used by everyone from boomers (60s-80s) through Gen Alpha growing into adulthood, on mobile and desktop, with a strong printable version._

This report synthesizes guidance from primary/authoritative sources (W3C WAI/WCAG, MDN, Google Search Central, Nielsen Norman Group, GOV.UK, plainlanguage.gov, web.dev) and real-world patterns from leading cooking sites (NYT Cooking, Serious Eats, King Arthur Baking, Smitten Kitchen, Simply Recipes, BBC Good Food, Bon Appetit). Source-confidence notes are included where a claim is single-source or unverified.

---

## 1. Recipe Page UX Best Practices

### The "wall of text before the recipe" problem
- The long personal preamble before a recipe is the single most-mocked recipe-blog pattern, and it's there for concrete reasons:
  1. **SEO / dwell time** — search rewards substantial original content and time-on-page.
  2. **Ad revenue** — more scrolling = more ad impressions.
  3. **Copyright** — a bare list of ingredients and steps is *not* protected by US copyright; only the surrounding creative expression (headnotes, descriptions, photos) is, so the story is partly a legal moat against scraping.
  - Sources: [Good/Bad Marketing](https://www.goodbadmarketing.com/keith/online-recipe-blogs-start-with-story/), [Bootstrapped Ventures](https://bootstrapped.ventures/why-do-recipe-blogs-have-stories/), [Bad Manners (Substack)](https://badmanners.substack.com/p/why-recipes-have-a-wall-of-text)
- **What users actually want:** one food blogger's reader survey found a roughly **50/50** split between wanting the story vs. skipping to the recipe — and casual search visitors (the majority of traffic) skew even more toward "skip." This is the entire justification for a "Jump to Recipe" button. ([Kitchen Treaty](https://www.kitchentreaty.com/why-i-dont-just-get-to-the-recipe/))
- Balance view: some defend headnotes as genuinely useful (substitutions, technique, "why it works"). ([Chatelaine](https://chatelaine.com/food/food-blog-recipe-storytelling/))
- **Recommendation:** keep a short, scannable headnote; put the structured recipe card high on the page; always offer a skip-to-recipe path.

### "Jump to Recipe" button + recipe card at top
- Provide a prominent **"Jump to Recipe"** anchor link visible **without scrolling** (especially mobile), with the literal label and smooth scroll. It's the standard remedy for preamble frustration and reduces bounce. Its *absence* signals the site doesn't value the user's time. ([Bootstrapped Ventures](https://bootstrapped.ventures/jump-to-recipe/), [WPBeginner](https://www.wpbeginner.com/wp-tutorials/how-to-add-a-jump-to-recipe-button-in-wordpress/))
- Pair it with a self-contained **recipe card** near the top: title, photo, times, yield, ingredients, steps as one structured unit. (Standard in WP Recipe Maker / Tasty Recipes sites like Sally's Baking Addiction, Pinch of Yum.) ([SideChef UX](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites))

### Clear ingredient lists + numbered steps
- Ingredients as a clean scannable list (quantity + unit + item); instructions as **numbered, discrete steps** with visual breaks, not one dense paragraph. Numbered steps let cooks track their place glancing between screen and stove. ([SideChef UX](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites), [NielsenIQ](https://nielseniq.com/global/en/insights/commentary/2008/3-ways-to-improve-the-usability-of-recipes/))

### Scalable serving sizes (1x / 2x / 3x)
- Let users rescale in the card via **1x / 2x / 3x** multipliers, ideally with an editable servings/yield number for arbitrary scaling. Warn that linear scaling is imperfect for salt, leavening, and intense aromatics. ([Recipe Card Blocks](https://recipecard.io/recipe-converter/), [Schweid & Sons](https://schweidandsons.com/blog/scaling-recipes-like-a-pro-essential-tips-for-adjusting-serving-sizes/))
- NYT Cooking currently offers only 0.5x/2x and users request more — a signal that flexible scaling is the desired bar. ([NYT Cooking app reviews](https://apps.apple.com/us/app/nyt-cooking-quick-tasty-meals/id911422904))

### Unit toggles: metric/imperial and volume/weight (cups <-> grams)
- Offer an in-card toggle between **US/imperial and metric**, ideally **volume vs. weight** (baking is far more accurate by weight). Default to the audience's region; make switching one tap.
- **Gold standard — King Arthur Baking:** publishes volume, US ounces, AND metric grams together, backed by a canonical [Ingredient Weight Chart](https://www.kingarthurbaking.com/learn/ingredient-weight-chart) (1 cup AP flour = 120 g). Because density varies (1 cup butter = 226 g vs. flour ~120 g), prefer **per-ingredient** weight conversions over a single blanket cup->gram factor.
- Serious Eats develops by weight for precision and provides both metric and US measures. ([Drizzle Lemons site list](https://www.drizzlelemons.com/recipe-extractor))

### Checkable / strike-through ingredients (and steps)
- Make each ingredient and step **tappable to mark done** (strikethrough/check state) so cooks track progress hands-free. Standard in NYT Cooking and modern card plugins. ([SideChef UX](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites))

### "Cook Mode" — keep the screen awake (Screen Wake Lock API)
- The **Screen Wake Lock API** prevents the screen dimming/locking — MDN's headline use case is literally following a recipe with hands full of dough. Reached cross-browser Baseline in **March 2025** (Chrome 85+, Edge 90+, Safari 16.4+, Firefox 126+). Requires HTTPS and a user gesture.
  ```javascript
  let wakeLock = null;
  try { wakeLock = await navigator.wakeLock.request("screen"); }
  catch (err) { console.error(`${err.name}, ${err.message}`); }
  // re-acquire on visibilitychange; release on exit
  ```
  - Sources: [MDN Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), [Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/wake-lock), [web.dev: supported in all browsers](https://web.dev/blog/screen-wake-lock-supported-in-all-browsers)
- Add a **"Cook Mode" toggle** under the title that requests the lock; re-acquire on `visibilitychange` (locks drop when backgrounded); warn about battery drain. Real implementers: **Simply Recipes, EatingWell, Food & Wine**, and WP Recipe Maker / WP Tasty "Cook Mode" blogs. ([Bootstrapped Ventures: Cook Mode](https://bootstrapped.ventures/cook-mode/), [WP Tasty](https://www.wptasty.com/cook-mode))
- _Single-source / treat with caution:_ a "+300% purchase intent" claim for Betty Crocker after adding wake lock appears in vendor-adjacent write-ups only.

### Built-in timers / tappable times
- Make durations in steps ("simmer 20 minutes") **tappable to start an in-page countdown** so cooks don't leave the page. NYT Cooking and many WP Recipe Maker / Tasty blogs auto-detect times. ([SideChef UX](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites))

### Schema.org Recipe structured data + Google rich results
- Embed **`Recipe` JSON-LD** (`<script type="application/ld+json">`) for rich results, host carousels, and image-search enhancements.
  - Required: **`name`**, **`image`**.
  - Recommended: `author`, `datePublished`, `description`, `prepTime`/`cookTime`/`totalTime` (ISO 8601), `recipeYield`, `recipeIngredient`, `recipeInstructions` (`HowToStep`/`HowToSection`), `nutrition.calories`, `aggregateRating`, `video`, `recipeCategory`, `recipeCuisine`, `keywords`.
  - For collections, add `ItemList` + a summary page to qualify for the host carousel. Validate with Google's Rich Results Test.
  - Sources: [Google Search Central — Recipe](https://developers.google.com/search/docs/appearance/structured-data/recipe), [Schema.org Recipe](https://schema.org/Recipe)

---

## 2. Cross-Generational Accessibility

A site spanning 60s-80s through teens must satisfy the strictest end (older adults, with the most vision/motor/cognitive constraints) while staying engaging for the young. Key insight: accessible design is **common-ground design** — what helps older adults rarely hurts younger ones.

### Designing for older adults (60s-80s)
- Nielsen Norman Group's research (123 participants 65+) found users 65+ are ~**43% slower** at web tasks than users 21-55, mostly due to illegible text, tiny targets, and small/light interactive elements. ([NN/g: Usability for Senior Citizens](https://www.nngroup.com/articles/usability-for-senior-citizens/))
- **Font size:** the National Institute on Aging "Making Your Web Site Senior Friendly" checklist recommends **minimum 12 pt, preferably 14 pt** body type, sans-serif, generous (double) line spacing, left-justified, no all-caps/italics. Web translation: base font ~**18-20 px** rather than the common 16 px. ([NIA](https://www.nia.nih.gov/), [NIA senior-friendly PDF mirror](https://ccids.umaine.edu/wp-content/uploads/sites/26/2011/11/NIA_Print_Materials_Senior_Friendly.pdf))
- Always let users enlarge text; high contrast (dark on light, avoid light-gray-on-white); big tap targets (44-48 px); **avoid hover-only interactions** (invisible on touch, hard for tremor); simple shallow navigation with multiple ways to find content.

### WCAG basics most relevant here (W3C WAI)
- **1.4.3 Contrast (Minimum), AA:** **4.5:1** normal text, **3:1** large text. ([W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html))
- **1.4.6 Contrast (Enhanced), AAA:** **7:1** — worth targeting for a senior-heavy audience. ([W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html))
- **1.4.11 Non-text Contrast, AA:** UI components/icons/focus states **3:1**. ([W3C](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html))
- **1.4.4 Resize Text, AA:** text scales to **200%** without loss — use rem/em/%, not fixed px. ([W3C](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html))
- **2.5.8 Target Size (Minimum), AA (WCAG 2.2):** **24x24 CSS px** floor. ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html))
- **2.5.5 Target Size (Enhanced), AAA:** **44x44 CSS px** — the recommended target here. ([W3C](https://www.w3.org/WAI/WCAG21/Understanding/target-size-enhanced.html))
- **3.1.5 Reading Level, AAA:** aim for lower-secondary (age ~11-14). ([W3C](https://www.w3.org/WAI/WCAG21/Understanding/reading-level.html))
- **2.4.5 Multiple Ways, AA:** more than one way to find a page (search, nav, sitemap, breadcrumbs). ([W3C](https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways.html))
- W3C WAI on older users: [Older Users and Web Accessibility](https://www.w3.org/WAI/older-users/), [Developing for older users](https://www.w3.org/WAI/older-users/developing/)

### Platform target-size guidance
- **Apple HIG:** minimum **44x44 pt**. ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/))
- **Material Design:** minimum **48x48 dp**. ([Material 3](https://m3.material.io/foundations/designing/structure))
- Standardize primary buttons/links at ~**48 px** tall with ample spacing — satisfies Apple, Material, and WCAG AAA at once.

### Search and browse navigation
- Provide **both search and category browse** — complementary, not either/or. Navigation teaches structure and is often faster than composing a query, which less-confident/older users struggle with. ([NN/g: Search Is Not Enough](https://www.nngroup.com/articles/search-not-enough/))
- Make the search box **visible and simple** (open field, not behind an icon), top of page, wide enough to show the query. ([NN/g: Search box](https://www.nngroup.com/articles/search-visible-and-simple/))
- Plain-language category labels, shallow consistent menus, breadcrumbs.

### Plain language and reading level
- Aim for a **reading age of ~9** (GOV.UK standard; ~1 in 7 adults read at/below age 9-11 level, and even expert readers prefer plain language). Short sentences, common words, active voice, "you", logical structure, reader-tested. ([GOV.UK content design](https://www.gov.uk/guidance/content-design/writing-for-gov-uk), [plainlanguage.gov guidelines](https://www.plainlanguage.gov/guidelines/), [digital.gov plain language](https://digital.gov/guides/plain-language))
- **Avoid jargon both directions:** specialized cooking terms confuse older users; heavy Gen-Z slang also confuses them. Keep core copy neutral; explain technical terms on first use. ([ONS plain language](https://service-manual.ons.gov.uk/content/writing-for-users/plain-language))

### Engaging younger users without alienating older ones
- Accessibility is the shared foundation: large type, high contrast, big targets, plain language also help teens on small phones, in sunlight, one-handed. ([W3C WAI older users](https://www.w3.org/WAI/older-users/))
- Add youthful appeal in **layers that don't break the baseline**: vibrant color (still meeting contrast), bolder display headings, imagery, optional animation (respect `prefers-reduced-motion`). Never make swipe-only/gesture-heavy/hidden-menu the *only* path — always provide a clear button-based route. ([Big Drop](https://www.bigdropinc.com/blog/designing-for-different-generations-tips-for-a-multi-generational-audience-ux/))

---

## 3. Mobile-First Responsive Design for Recipes

### Mobile is the majority of recipe traffic
- Mobile is ~**63-64% of global web traffic (2026)**; recipe-specific signals are stronger — **over 60% of recipe searches are mobile**, with reports citing ~75% of people looking up recipes on phones while shopping. Treat the kitchen phone as the primary device. ([scalify.ai](https://www.scalify.ai/blog/what-percentage-web-traffic-is-mobile-2026-statistics), [amraandelma.com](https://www.amraandelma.com/recipe-platform-marketing-statistics/), [SideChef UX](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites))
- Build the single-column phone layout as canonical; everything else is progressive enhancement. Keep payload light.

### Hands-free / messy-hands kitchen UX
- Phone is propped at arm's length, hands wet/greasy, poor lighting, split attention — design for **glanceability at cooking distance**.
- Large thumb/knuckle-friendly tap targets with generous spacing; avoid tiny inline links during the cooking flow.
- **Step-by-step cook mode:** one step per screen or large numbered blocks; tap to mark complete. Interactive ingredient checklist (tap to cross off). Consider voice/gesture as the truly hands-free tier. ([SideChef UX](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites), [Tubik Studio case study](https://blog.tubikstudio.com/case-study-recipes-app-ux-design/))

### Typography for cooking distance
- Instruction text **minimum 18px**, generous line-height; step text **20-22px** in cook mode (read from farther away). High contrast for poor kitchen lighting.

### Responsive breakpoints / layout
- **Mobile (single column):** ingredients then method stacked; collapsible sections; sticky top/bottom bar for search, timer, shopping list.
- **Tablet/laptop (multi-column):** two-column with a **sticky ingredient list** (`position: sticky`) beside scrollable method, so cooks reference ingredients without losing their place; `display: grid` with column counts increasing by breakpoint.
- Use a fluid grid plus a few breakpoints (~600px, ~1024px) and let content reflow rather than device-specific pixel hacks. ([subframe.com](https://www.subframe.com/tips/recipe-website-design-examples), [muffingroup.com](https://muffingroup.com/blog/recipe-website-design/))

### Keep the screen awake
- Tie the Screen Wake Lock API (Section 1) to cook mode: acquire on entering step-by-step view, release on exit, re-acquire on `visibilitychange`. ([Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/wake-lock))

---

## 4. Print Best Practices

### Use a dedicated print stylesheet via `@media print`
- Wrap print rules in `@media print { ... }` (or a `media="print"` linked sheet). Black-on-white, drop background images to save ink. Use `pt` not `px` for type in print. ([MDN: Printing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing), [Smashing: print style sheet](https://www.smashingmagazine.com/2011/11/how-to-set-up-a-print-style-sheet/), [Smashing: tips & tricks](https://www.smashingmagazine.com/2013/03/tips-and-tricks-for-print-style-sheets/))

### What to strip vs. keep
- **Strip** (`display:none`): site nav/header, sidebars, ads, comments, social-share, related links, footers, pop-ups, the "Jump to Recipe" UI.
- **Keep:** title, yield/servings, times, ingredients, method, optionally one hero photo. CSS-Tricks's own print sheet switches body type to a **serif (Georgia)** for paper readability and expands link URLs with `a[href]::after { content: " (" attr(href) ")"; }` (skip for in-page anchors). ([CSS-Tricks print stylesheet](https://css-tricks.com/css-tricks-finally-gets-a-print-stylesheet/), [SitePoint](https://www.sitepoint.com/css-printer-friendly-pages/))

### Page-break control (keep ingredients + steps intact)
- Use `break-inside: avoid;` (with legacy `page-break-inside: avoid;` alias) on ingredient lists, individual steps, and figures so they don't split across pages.
  ```css
  @media print {
    .recipe-step, .ingredients, figure { break-inside: avoid; page-break-inside: avoid; }
    h2, h3 { break-after: avoid; }
  }
  ```
- Caveat: if an element is **taller than a full page the browser breaks it anyway** — keep steps short. Prefer modern `break-after`/`break-before` over legacy `page-break-*`. ([MDN: break-inside](https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside), [MDN: page-break-inside](https://developer.mozilla.org/en-US/docs/Web/CSS/page-break-inside))

### `@page` for paper setup and recipe-card sizes
- Control margins/size with `@page`. For **index-card printing**, 4x6" is the most common card size today:
  ```css
  @page { margin: 1cm; }
  /* card view: */
  @page { size: 4in 6in; margin: 0.25in; }
  ```
  Offer a compact card-sized view so users can print onto 4x6 stock or trim for a recipe box. ([MDN: @page](https://developer.mozilla.org/en-US/docs/Web/CSS/@page), [Cookbook People free 4x6 cards](https://store.cookbookpeople.com/extras/free-printable-recipe-cards-pdfs-download-400-designs-instantly/))

### Photos when printing
- Make hero/step photos **optional** (hide by default to save ink, or give a toggle). WP Recipe Maker lets visitors choose which images to print. ([WP Recipe Maker print docs](https://help.bootstrapped.ventures/docs/wp-recipe-maker/print-recipes/))

### "Print this recipe" affordance
- Provide a visible **"Print Recipe" button** calling `window.print()`. Two architectures: (a) one page + print stylesheet, or (b) a separate **print-only recipe view/route** (WP Recipe Maker approach — printed output even reflects serving-size adjustments). King Arthur's Recipe Box lets users view/print saved recipes. ([Bootstrapped Ventures: print recipe](https://bootstrapped.ventures/print-recipe/), [King Arthur Recipe Box](https://www.kingarthurbaking.com/recipebox))
- Further reading: [Smashing: Designing for Print with CSS](https://www.smashingmagazine.com/2015/01/designing-for-print-with-css/), [Smashing: print stylesheets in 2018](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/), [DiDoesDigital](https://didoesdigital.com/blog/print-styles/).

---

## 5. Photos in Recipes

### The finished-dish photo is effectively mandatory
- A clear, appetizing hero photo sets expectations, inspires, and is the strongest "is this worth making?" signal. Allow user-uploaded "I made this" photos in reviews as a trust/community signal. High-quality photos measurably increase time-on-page. ([SideChef UX](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites), [Tubik Studio](https://blog.tubikstudio.com/case-study-recipes-app-ux-design/))

### Step / process photos — use where words are ambiguous
- Reserve process photos for steps with a visual judgment call (shaping dough, doneness cues, knife work), not trivial steps. **King Arthur Baking** is the benchmark (step photo sequences + "why" sidebars); **Serious Eats "The Food Lab"** is the model for photo-heavy technique/comparison explanation. ([King Arthur Guides](https://www.kingarthurbaking.com/learn/guides), [King Arthur Tips & Techniques](https://www.kingarthurbaking.com/blog/category/tips-and-techniques), [NPR on The Food Lab](https://www.npr.org/sections/thesalt/2015/11/13/455755908/a-kitchen-science-savant-shares-his-secrets-in-the-food-lab))

### Before/after photos
- Use paired before/after for transformations where the change is the point (dough before/after proof, raw vs. seared). Label them explicitly ("after a 1-hour proof") so they work as a diagnostic.

### Accessibility — alt text for food photos
- Decide informative vs. decorative per the **W3C WAI alt decision tree**. Informative photos get brief meaningful alt ("golden-brown loaf with deep cross-hatch score and open crumb") not "photo of bread"; decorative/repetitive shots get `alt=""`; image links get functional alt describing the destination. ([WAI alt Decision Tree](https://www.w3.org/WAI/tutorials/images/decision-tree/), [WAI Images Tutorial](https://www.w3.org/WAI/tutorials/images/), [WAI Decorative Images](https://www.w3.org/WAI/tutorials/images/decorative/))

### Performance — photos must not block the recipe
- Lazy-load below-the-fold images (`loading="lazy"`) but load the **hero/LCP image eagerly**. Always set explicit `width`/`height` to prevent layout shift (CLS). Serve responsive `srcset`/`sizes` and modern formats (WebP broad support; AVIF often >50% smaller than JPEG). ([web.dev: lazy loading](https://web.dev/articles/browser-level-image-lazy-loading), [web.dev: image performance](https://web.dev/learn/performance/image-performance), [MDN: fix LCP](https://developer.mozilla.org/en-US/blog/fix-image-lcp/))
- **Resolve the big-photo-vs-fast-access tension:** compact hero + "Jump to Recipe" + lazy-loaded process photos interleaved beside the relevant step, so imagery never delays first paint of the recipe.

---

## 6. Cooking Tips & Reference Content

### Maintain a browsable "how-to / techniques" hub, separate from recipes
- Strong sites treat technique as first-class content:
  - **King Arthur Baking** — [Guides hub](https://www.kingarthurbaking.com/learn/guides), [Tips & Techniques](https://www.kingarthurbaking.com/blog/category/tips-and-techniques), [Recipe Success Guide](https://www.kingarthurbaking.com/recipes/resources/recipe-success-guide).
  - **Serious Eats** — "The Food Lab" science column / techniques (J. Kenji Lopez-Alt). ([Wikipedia: The Food Lab](https://en.wikipedia.org/wiki/The_Food_Lab))
  - **BBC Good Food** — [Howto / cookery-school hub](https://www.bbcgoodfood.com/howto) with skills, glossary explainers, conversions.
  - **NYT Cooking** — [Guides](https://cooking.nytimes.com/guides) (How to Make rice, roast chicken, etc.).
  - **Bon Appetit** — [Basically](https://www.bonappetit.com/basically) for fundamentals aimed at newer cooks.
- Build a small set of evergreen technique/how-to pages plus a glossary in their own section (they rank in search and are reusable).

### Measurement / conversion references — per-recipe AND standalone
- In-recipe metric+volume toggles plus a permanent reference: [King Arthur Ingredient Weight Chart](https://www.kingarthurbaking.com/learn/ingredient-weight-chart) (cups -> grams/oz) and [Conversions reference](https://www.kingarthurbaking.com/pro/reference/conversion).
- Oven temp reference should cover degF <-> degC <-> gas mark and note fan/convection runs ~20 degC lower (350 degF ~ 177 degC; 400 degF ~ 204 degC). Prefer per-ingredient weight conversions over a blanket cup->gram factor (density varies). ([Saga conversion tables](https://www.saga.co.uk/magazine/homes/cooking-measurement-conversion-tables))

### Linking technique content from recipes without clutter
- Inline contextual links: when a recipe says "cream the butter," "fold," "temper," "blind bake," link the phrase to a guide/glossary entry instead of re-explaining each time. Add a compact "Techniques used in this recipe" / "Cook's notes" box rather than long prose; interleave a process photo/tip beside the specific step. Keep the recipe card itself minimal.

---

## 7. Preserving Family & Heritage Character

Core tension: heirloom recipes carry emotional weight (handwriting, stains, stories, "Grandma added a pinch more") but that character must never bury the usable recipe. The convergent pattern is **dual-layer**: a clean recipe up front, heritage material attached/optional/alongside.

### Capture stories and annotations WITHOUT burying the recipe
- **Adopt the headnote tradition, but keep it short and skippable.** Good headnotes convey why the recipe is noteworthy and why to trust the author (the Smitten Kitchen voice), but the long-intro backlash is real. Cap the visible headnote at ~2-3 sentences; move longer stories into a collapsible block. ([Food52: headnotes matter](https://food52.com/story/23840-why-recipe-headnotes-matter-kevin-kruse-tweet), [Slate: headnote wars](https://slate.com/human-interest/2020/02/food-blog-recipe-headnote-wars.html), [Smitten Kitchen](https://smittenkitchen.com/))
- **"Jump to Recipe" lets storytellers and skim-cooks coexist.** ([Bootstrapped Ventures](https://bootstrapped.ventures/jump-to-recipe/), [Recipe Kit](https://recipekit.com/blogs/our-blog/recipe-blog-navigation-best-practices))
- **Treat marginalia as data, not noise:** "Call out margin notes and crossed-out ingredients rather than editing them away — those details are the history." Model annotations as a first-class "Family notes / Variations" block rendered distinctly (sidebar/callout/different typeface), preserved verbatim. ([Recipe Memory](https://www.recipememory.com/blog/the-untold-stories-behind-handwritten-recipe-cards/))

### Attribution / provenance (who, when, where)
- Capture structured provenance per recipe: who created it, who passed it down, when first made, where/occasion, why it matters. Preservation guides recommend "recipe biography sheets" plus metadata (card age, who wrote it). Add fields: `attributedTo`, `contributedBy`, `year`/`era`, `place`, `provenance` chain ("From Nonna Maria, Calabria, c. 1950 -> transcribed by Aunt Lucia, 1998"), shown as a compact byline under the title. ([Recipe Memory](https://www.recipememory.com/blog/the-untold-stories-behind-handwritten-recipe-cards/), [Family Legacy Series](https://www.familylegacyseries.com/preserving-family-recipes-and-traditions-how-to-create-a-lasting-culinary-legacy-through-storytelling-and-digital-archiving))

### How heritage cookbook services handle stories + provenance
- Family cookbook services bundle recipes + photos + stories as a unit and support multi-contributor entry. **Heritage Cookbook**'s flow is "Select template -> Add recipes & stories -> Invite family -> Personalize -> Order," with upload of handwritten cards/photos. **The Family Cookbook Project** centers collaborative contribution plus an AI recipe converter and story fields. Learn from the headnote backlash: keep the *cooking* view clean and the story view separate. ([Heritage Cookbook](https://heritagecookbook.com/family-cookbook), [Family Cookbook Project](https://www.familycookbookproject.com/))
- **3-2-1 backup rule** for irreplaceable original scans: three copies, two media types, one off-site. ([Family Legacy Series](https://www.familylegacyseries.com/preserving-family-recipes-and-traditions-how-to-create-a-lasting-culinary-legacy-through-storytelling-and-digital-archiving))

### Show scanned original cards alongside a clean typed version
- The single most-recommended technique: include both the typed recipe AND a photo of the original card. The original's handwriting, spelling, stains, and margin notes "remind family members of the person." Don't auto-correct the scan's quirks — they *are* the heirloom. Every recipe should support an attached scan displayed next to (or one tap from) the clean version. ([CreateMyCookbook](https://createmycookbook.com/blog/how-to-save-your-handwritten-recipes), [Artkive](https://blog.artkiveapp.com/post/family-recipe-cards-cookbook), [BW Photo Organizing](https://www.bwphotoorganizing.com/post/from-handwritten-to-digital-family-recipes))

### Digitizing handwriting (OCR vs. transcription)
- Use a hybrid: photograph original + OCR + manual cleanup. OCR accuracy drops on cursive (print 85-95%; cursive 60-75%; challenging 30-50%), so keep the **photo as source of truth** and treat OCR as an editable draft the family verifies. Tag recipes (category, cuisine, contributor) for searchability. ([myrecipe: convert handwritten](https://myrecipe.app/blog/convert-handwritten-recipes-digital))

### Community / family "collective wisdom"
- **Model NYT Cooking's "Notes," not generic comments.** NYT calls feedback "notes," human-reviews each, and rejects purely opinionated/hostile entries, leaving tested substitutions and tweaks; it downplays profiles so contribution isn't self-promotion. Add a per-recipe **"Family Notes"** thread framed as useful tips/variations ("we use half the sugar") — the family's evolving collective wisdom, and a natural home for "Grandma added a pinch more" from living relatives. ([The Ringer: NYT Cooking notes](https://www.theringer.com/2019/02/07/food/nytcooking-comment-section))

### Audio / oral history
- Record the cooking, not just the recipe — many heirloom dishes were never written down. Interview in the kitchen, use open prompts, voice/video-record during cooking to capture tacit knowledge (kneaded-dough feel, sizzle). Allow an optional audio/video attachment per recipe so a grandparent's voice is preserved alongside the steps. ([Family Legacy Series](https://www.familylegacyseries.com/preserving-family-recipes-and-traditions-how-to-create-a-lasting-culinary-legacy-through-storytelling-and-digital-archiving), [Recipe Memory](https://www.recipememory.com/blog/the-untold-stories-behind-handwritten-recipe-cards/), [Historians for History: oral histories](https://historiansforhistory.wordpress.com/2022/08/16/sweet-memory-extracting-oral-histories-from-unwritten-african-american-recipes-by-andre-taylor/))

---

## Design Principles (for this site)

1. **Recipe first, story second.** The structured recipe card is the hero of every page, reachable instantly. Heritage and narrative are layered on, never blocking.
2. **Design to the most-constrained user; delight the rest.** Build for older adults' legibility, contrast, and big targets as the non-negotiable baseline; add youthful visual energy in layers that never break that baseline.
3. **Accessibility is common ground, not a compromise.** WCAG AA minimum, AAA where cheap (contrast, target size) — it serves both ends of the age range simultaneously.
4. **Hands-free, glanceable kitchen mode.** Cook mode with wake lock, large step text, tap-to-check ingredients/steps, tappable timers — for a propped-up phone with messy hands.
5. **One source, many views.** A single structured recipe renders as: screen view, cook mode, clean print, and 4x6 card. Scaling and unit choices propagate to all of them.
6. **Plain language, low jargon.** Reading age ~9; explain technique terms on first use and link to a glossary; avoid both chef-jargon and generation-specific slang in core copy.
7. **Photos help, never hinder.** Compact eager hero + lazy process photos beside the steps they explain; meaningful alt text; modern formats.
8. **Preserve the human hand.** Keep scanned originals, handwriting, and verbatim family notes intact and attributed — alongside, not instead of, a clean typed recipe.
9. **The family is the comment section.** A moderated NYT-style "Family Notes" layer captures evolving collective wisdom and living-relative annotations.
10. **Structured data throughout.** Schema.org Recipe JSON-LD + explicit provenance fields make recipes discoverable, machine-readable, and durable.

---

## Requirements Checklist

### Recipe page / UX
- [ ] Self-contained recipe card high on the page (title, photo, times, yield, ingredients, steps).
- [ ] "Jump to Recipe" button visible without scrolling on mobile; smooth scroll.
- [ ] Short headnote (~2-3 sentences) with longer story in a collapsible block.
- [ ] Ingredients as a clean list; instructions as numbered discrete steps.
- [ ] Tap-to-check ingredients and steps (strikethrough state).
- [ ] Serving scaler (1x/2x/3x + editable yield) propagating to all views; scaling caveat note.
- [ ] Unit toggle: imperial/metric and volume/weight; per-ingredient gram conversions.
- [ ] Cook Mode toggle using Screen Wake Lock API (re-acquire on `visibilitychange`, release on exit, battery note).
- [ ] Tappable in-step timers.
- [ ] Schema.org `Recipe` JSON-LD (name, image required; full recommended set); validate with Rich Results Test.

### Accessibility (cross-generational)
- [ ] Base body font ~18-20px; user-resizable to 200% (rem/em units).
- [ ] Contrast >= 4.5:1 text / 3:1 large & UI; target 7:1 where feasible.
- [ ] Interactive targets ~48px tall with spacing (>= WCAG AAA 44px; never below 24px).
- [ ] No hover-only interactions; tap/click equivalents everywhere.
- [ ] Both search (visible open field) and category browse; breadcrumbs; shallow consistent nav (WCAG 2.4.5 Multiple Ways).
- [ ] Plain language ~reading age 9; technique terms defined/glossary-linked.
- [ ] Respect `prefers-reduced-motion`; no swipe/gesture-only critical paths.

### Mobile-first / responsive
- [ ] Single-column canonical mobile layout; ~600px and ~1024px breakpoints, fluid grid.
- [ ] Step text 18px+ (20-22px in cook mode); high contrast for poor lighting.
- [ ] Sticky ingredient list beside method on tablet/desktop (`position: sticky`).
- [ ] Sticky access to search/timer/shopping-list; collapsible sections on mobile.
- [ ] Light payload / fast first paint.

### Print
- [ ] `@media print` stylesheet stripping nav/ads/comments/social/related; serif body; `pt` units.
- [ ] `break-inside: avoid` (+ legacy alias) on steps, ingredients, figures; short steps.
- [ ] Ingredients + method on one page where they fit.
- [ ] `@page` standard view + optional **4x6 recipe-card** view.
- [ ] Optional photo inclusion in print.
- [ ] Visible "Print Recipe" button (`window.print()`); printed output reflects scaling/unit choices.

### Photos
- [ ] One optimized eager hero (WebP/AVIF, `srcset`/`sizes`, explicit dimensions).
- [ ] Lazy-loaded process photos interleaved beside relevant steps; before/after where useful, labeled.
- [ ] Meaningful alt text for informative images; `alt=""` for decorative; functional alt for image links.
- [ ] User "I made this" photos in reviews/notes.

### Reference content
- [ ] Evergreen technique/how-to hub + glossary in its own section.
- [ ] Standalone conversion references (cups->grams per ingredient; degF/degC/gas mark; fan-oven note).
- [ ] Inline contextual links from recipe terms to guides/glossary; compact "Cook's notes" box.

### Heritage / family character
- [ ] Structured provenance fields: created-by, passed-down-by, year/era, place, provenance chain; shown as byline.
- [ ] Attach scanned original card per recipe, displayed alongside clean typed version (quirks preserved).
- [ ] Distinct verbatim "Family Notes / Variations" block (the "pinch more" lore).
- [ ] Multi-contributor entry; OCR-as-draft workflow with photo as source of truth; family verification.
- [ ] Moderated NYT-style "Family Notes" thread for tips/variations.
- [ ] Optional audio/video attachment per recipe (oral history).
- [ ] 3-2-1 backup for irreplaceable original scans.

---

### Source-confidence notes
- Directly fetched / high confidence: MDN (Wake Lock, print, break-inside, @page), Google Search Central Recipe, W3C WAI/WCAG pages, web.dev, King Arthur Ingredient Weight Chart, NN/g articles.
- From search summaries (reliable, not each individually fetched): the ~50/50 preamble survey, NYT Cooking 0.5x/2x scaling, Cook Mode adopters (Simply Recipes/EatingWell/Food & Wine), mobile-traffic percentages.
- Single-source / verify before relying: Betty Crocker "+300% purchase intent"; OCR accuracy percentages. Recipe-site section URLs (Serious Eats, BBC Good Food, NYT Cooking, Bon Appetit landing pages block automated fetch) follow each site's known public structure — worth a manual click-through before publishing.
