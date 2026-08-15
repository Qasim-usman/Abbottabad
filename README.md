# Abbottabad — The City of Pines

A complete, production-quality static website about Abbottabad, Pakistan, built in a
**neobrutalist** visual language: solid 3 px black borders, zero-blur offset shadows,
flat accent blocks, oversized display type — and smooth, restrained scroll motion on
top of it.

Plain HTML5, CSS3 and vanilla JavaScript. **No build step, no frameworks, no
dependencies.** Every file is served exactly as it sits in this folder, so it hosts
free on GitHub Pages (or any static host) without a pipeline.

## What's in it

Eight pages, sharing one header, footer and design system:

| Page | What it covers |
| --- | --- |
| `index.html` | Hero, marquee, count-up stat tiles, scroll-driven "top places" strip, teasers for every page |
| `history.html` | Scroll-animated timeline: Gandhara roots → founding in January 1853 → the 2005 earthquake → today |
| `places.html` | 13 places, filterable by Nature / Historic / Religious / Family, each opening an accessible modal |
| `food.html` | Chapli kabab, karahi, trout, pink chai, bazaars, and a numbered one-day eating route |
| `culture.html` | Languages, hospitality, festivals, handicrafts, education and Hazarewal identity in alternating colour bands |
| `visit.html` | Getting there from Islamabad, month-by-month weather table, packing list, transport, etiquette |
| `gallery.html` | Masonry photo wall with tilted frames and a keyboard/swipe lightbox |
| `contact.html` | Validated demo form (no backend), static map placeholder, social stickers |

### Built-in behaviour

- Dark mode toggle, persisted in `localStorage`, honouring `prefers-color-scheme` on
  first visit, applied before first paint so there is no flash of the wrong theme
- Sticky navbar with active-page indicator, sliding hover underline, and a full-height
  mobile drawer with focus trapping, Escape to close and body scroll lock
- Scroll-progress bar, back-to-top sticker, page-transition wipe
- One `IntersectionObserver` reveal system (`up | left | right | scale | mask`) with
  stagger support and three separate failsafes so content can never stay invisible
- Optional inertial smooth scrolling (desktop, fine pointer, motion allowed)
- Cheap parallax, count-up counters, CSS marquee, per-word hero mask reveal
- Every animation gated behind `prefers-reduced-motion`, and the whole site remains
  readable and usable with JavaScript switched off

## Folder map

```
.
├── index.html            ← home; also the reference for shared head/nav/footer markup
├── history.html
├── places.html
├── food.html
├── culture.html
├── visit.html
├── gallery.html
├── contact.html
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── css/
│   └── style.css         ← 1. reset  2. tokens  3. base  4. layout
│                           5. components  6. animations  7. page overrides  8. utilities
├── js/
│   └── main.js           ← one IIFE, 18 named modules + boot(), ~1,100 commented lines
└── images/
    ├── README.md         ← every filename the site expects, with ratios
    └── ph-*.svg          ← flat placeholder blocks (pine/mustard/tomato/sky/lilac/ink)
```

## Run it locally

Any static server works. From this folder:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Alternatives: `npx serve .`, `php -S localhost:8000`,
or the VS Code "Live Server" extension.

Opening `index.html` directly from the filesystem mostly works too, but a server is
better — relative links, `localStorage` and the fonts behave more like production.

## Swap the photographs

1. Read `images/README.md` — it lists every filename the site expects, which page uses
   it, and the aspect ratio to match.
2. Drop your file into `images/` under that exact name.
3. Update the `src` on the matching `<img>` (search the HTML for the filename printed
   on the frame, e.g. `images/shimla-hill.jpg`).
4. Delete the `<span class="frame__tag">…</span>` next to it so the filename hint
   disappears.
5. In `gallery.html`, tiles are links: update **both** the `href` on
   `<a class="tile">` and the `src` on the `<img>` inside it.

Keep the `width` and `height` attributes roughly proportional to the real file — they
reserve the box and prevent layout shift. Keep files under ~300 KB. Do not hotlink
images you do not own.

## Change the text

All copy is plain HTML — there is no CMS and no templating. Edit the page directly.

Two things are duplicated across pages, because there is no build step:

- **The `<head>`** (title, description, canonical URL, Open Graph, Twitter card,
  JSON-LD). Each page has its own; update the one you are editing.
- **The navbar and footer.** They are identical in all eight files. If you add a nav
  link, add it in all eight — the mobile drawer builds itself from the navbar at
  runtime, so it updates automatically.

The absolute URLs — canonical, Open Graph, Twitter, JSON-LD, `robots.txt` and
`sitemap.xml` — all point at the live site, `https://abbottabad.vercel.app/`. If the
domain ever changes, rewrite them in one pass:

```bash
grep -rl "abbottabad.vercel.app" . | xargs sed -i 's|https://abbottabad.vercel.app/|https://YOUR-URL/|g'
```

## Change the palette

Everything visual is a custom property in section 2 of `css/style.css`. Change a value
once and the whole site follows.

```css
:root {
  --paper:   #FFFDF7;   /* page background */
  --paper-2: #F2EFE3;   /* banded sections, skeleton blocks */
  --ink:     #0A0A0A;   /* body text */
  --pine:    #2F9E44;   /* accents — never used as pale tints */
  --mustard: #FFD43B;
  --tomato:  #FF6B4A;
  --sky:     #4DABF7;
  --lilac:   #B197FC;

  --bd-w: 3px;          /* border width, everywhere */
  --sh-o: 6px;          /* hard shadow offset */
  --radius: 2px;        /* keep this 0–4px or it stops looking neobrutalist */
}
```

If you change an accent, check its partner text colour (`--on-pine`, `--on-mustard`, …)
still passes contrast — those are what sit *on* the coloured block. Sections and cards
pick an accent with the `.u-pine`, `.u-mustard`, `.u-tomato`, `.u-sky`, `.u-lilac` and
`.u-ink` helper classes, so recolouring a section is a one-class change.

Dark mode overrides live in the `[data-theme="dark"]` block just below the tokens: it
flips paper and ink, switches borders and hard shadows to white, and keeps the accents
fully saturated.

Other knobs worth knowing:

| Token | Does |
| --- | --- |
| `--s-1` … `--s-7` | Spacing scale: 4 / 8 / 16 / 24 / 40 / 64 / 96 px |
| `--shell` | Max content width (1240 px, 1440 px above 1800 px) |
| `--nav-h` | Navbar height — also drives `scroll-padding-top` for anchors |
| `--ease`, `--t-fast/mid/slow` | Motion curve and durations |
| `--reveal-y`, `--reveal-x` | How far reveal animations travel |

## Tune or disable the motion

Every animation is already gated behind `prefers-reduced-motion: reduce` — in CSS
(section 6 of `style.css`) and again in JS (`reduced()` in `js/main.js`, checked by
Reveal, Counters, Parallax, HStrip, PageWipe, SmoothScroll and the modal/lightbox
transitions). Nothing below is needed for accessibility; it is for taste.

**Make reveals smaller, slower or faster** — edit the tokens:

```css
:root {
  --reveal-y: 32px;   /* vertical travel for data-reveal="up"    */
  --reveal-x: 40px;   /* horizontal travel for "left" / "right"  */
  --t-slow: 680ms;    /* reveal duration                        */
}
```

**Per element**, the markup is the whole API:

| Attribute | Effect |
| --- | --- |
| `data-reveal="up \| left \| right \| scale \| mask"` | Which entrance to use |
| `data-reveal-delay="120"` | Delay in ms for that one element |
| `data-stagger="70"` on a container | Auto-delays its children by 70 ms each |
| `data-parallax="0.2"` | Drifts at 0.2× scroll speed (desktop, motion allowed) |

**Turn a single effect off** by commenting out its entry in the `modules` array at the
bottom of `js/main.js`:

```js
var modules = [Theme, Nav, Progress, Reveal, Counters, Parallax, Marquee,
               HeroWords, Skeletons, HStrip, Filters, Modal, Lightbox,
               FormValidate, BackToTop, PageWipe, SmoothScroll];
```

- Drop `SmoothScroll` to get plain native scrolling (it only ever runs on ≥1024 px
  with a fine pointer anyway).
- Drop `Parallax` or `HStrip` to freeze the drifting art and the horizontal
  "top places" strip — the strip then reads as an ordinary scrolling row.
- Drop `PageWipe` to remove the accent panel between page loads.
- Drop `Reveal` and everything appears immediately: `showAll()` is also what runs when
  `IntersectionObserver` is missing, so removing it is safe.
- `Marquee` is CSS-driven; to stop the ticker instead set
  `animation: none` on `.marquee__track`, or delete the marquee markup from
  `index.html`.

**Remove reveals entirely** by deleting the `data-reveal` attributes, or add one rule:

```css
[data-reveal] { opacity: 1 !important; transform: none !important; }
```

Content can never get stuck invisible: the observer reveals on intersection, on a
resize/scroll re-check, and `boot()` force-reveals anything still hidden after 3 s.
With JavaScript off, `:root:not(.js)` rules show everything from the start.

## Deploy

The site is live on Vercel at **<https://abbottabad.vercel.app/>**, served from
<https://github.com/Qasim-usman/Abbottabad>. There is no build step, so every push to
`main` redeploys the folder as-is — nothing to configure and nothing to compile.

### Vercel, from scratch

1. Push the folder to GitHub.
2. On <https://vercel.com/new>, import the repository.
3. Framework Preset **Other**, Build Command **empty**, Output Directory **empty**
   (leave it as the repository root). Do not let it guess a build step.
4. *Deploy*. You get `https://PROJECT.vercel.app/` in under a minute.

Or from the CLI, in this folder:

```bash
npx vercel --prod
```

Answer *no* to "override settings" — the defaults publish the directory as-is.

Whichever route, point the absolute URLs at the domain you want indexed (see "Change
the text" above) — your custom domain if you add one under *Project* → *Settings* →
*Domains*, never a per-deployment preview URL. Vercel serves from the domain root, so
all the relative links keep working untouched.

### GitHub Pages, as an alternative

The same folder hosts on Pages with no changes:

1. **Set the URL first.** Rewrite the absolute URLs (see "Change the text") to
   `https://YOUR-USER.github.io/REPO/`.
2. **Enable Pages:** repository → *Settings* → *Pages* → Source **Deploy from a
   branch** → Branch `main`, folder `/ (root)` → *Save*.
3. Wait for the green check in the *Actions* tab, then open
   `https://YOUR-USER.github.io/REPO/`. First deploy usually takes under a minute.

Notes:

- If you name the repository `YOUR-USER.github.io` the site serves from the domain
  root and the URL has no `/REPO/` segment.
- Links are all relative, so the site works from a subfolder without changes. Only the
  canonical, Open Graph, JSON-LD and sitemap URLs are absolute — hence step 1.
- No `.nojekyll` file is needed: nothing here starts with an underscore.
- For a custom domain, add it under *Settings* → *Pages* → *Custom domain*, which
  writes a `CNAME` file, then update the absolute URLs again.
- Re-deploying is just `git push`; GitHub rebuilds on every commit to `main`.


