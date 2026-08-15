# images/

Every photo frame on the site currently shows a flat SVG placeholder. To use real
photographs, drop a file into this folder with the exact name below — no HTML or CSS
changes are needed. Delete the `<span class="frame__tag">…</span>` next to an image
once the real file is in place, so the filename hint stops showing.

## Already in place

These are real files, already wired into the pages — the rows further down are still
flat SVG placeholders.

| File | Used on | Ratio |
| --- | --- | --- |
| `og-cover.png` | all pages (social sharing) | 1200×630 — generated placeholder, swap for a photograph when you have one |
| `hero-abbottabad-valley.jpg` | index.html hero | 4:3 |
| `chapli-kabab.jpg` | food.html | 4:3 |
| `g-chapli-griddle.jpg` | gallery.html | 1:1 |
| `pink-chai.jpg` | food.html | 4:3 |
| `stone-church.jpg` | places.html + gallery.html | 4:3 |
| `g-old-street.jpg` | gallery.html | 1:1 |
| `thandiani.jpg` | places.html | 4:3 |
| `nathiagali.jpg` | places.html | 4:3 |
| `pipeline-track.jpg` | places.html | 4:3 |
| `ayubia.jpg` | places.html | 4:3 |

Full-resolution originals live in `originals/`, which is git-ignored — they are 3–5 MB
each and must never ship. Re-crop from there rather than from the shipped JPEGs.

### Licensing of the four Pexels photographs

`thandiani.jpg`, `nathiagali.jpg`, `pipeline-track.jpg` and `ayubia.jpg` come from
Pexels, whose licence permits use on a site like this. Attribution is not required, so
it is recorded here rather than in the page markup:

| File | Photographer | Source |
| --- | --- | --- |
| `thandiani.jpg` | Beigh Yabaar | <https://www.pexels.com/photo/32584966/> |
| `nathiagali.jpg` | Rubaitul Azad | <https://www.pexels.com/photo/15875948/> |
| `pipeline-track.jpg` | salman kazmi | <https://www.pexels.com/photo/11621378/> |
| `ayubia.jpg` | Iqbal farooz | <https://www.pexels.com/photo/15625058/> |

**Pexels lists no location for any of the four.** Each is a northern-subcontinent pine
forest scene that suits the card it sits on, but none is confirmed to be the place
named in the heading, so the `alt` text describes only what is visible in the frame and
never asserts the location. Swap any of them for a photograph you can place yourself.

Two photographs from that batch were **not** used: a stone village under snow-capped
limestone peaks and a river valley of alpine pasture and chalets. Both are clearly
European, not the Hazara valley, and captioning them as Abbottabad would make the page
factually wrong.

### Seven slots still open, and why some links can't fill them

`harnoi`, `ilyasi-masjid`, `sajikot-waterfall`, `sarban-hills`, `lady-garden`,
`jalal-baba-auditorium` and `karakoram-highway` were each offered as a link to an image
on another site — five Google Images thumbnails, one Pinterest upload and one Google
Places photo. None was used, on two counts:

- **Too small.** They measure 347×576, 500×375, 736×981, 387×516, 387×516, 547×365 and
  399×501. These frames render about 620 CSS px wide and want ~1240 px to stay sharp,
  and most of those files are portrait, so a 4:3 crop halves them again.
- **Not ours to publish.** They are other people's photographs. Copying them here would
  put the infringing copy on this domain, which is worse than hotlinking, not better.

Pexels and Wikimedia Commons both carry licence-clear photographs of the Galiyat, and
Commons has some of Abbottabad itself. Those are the places to look for the remaining
seven.

## Rules

- **Never hotlink** images from other sites. Use your own photographs, ones you have
  permission for, or images under a licence that allows reuse — and credit the
  photographer in the `alt` text or caption.
- Keep each file **under about 300 KB**. Resize to roughly 1600 px on the long edge
  and export JPEG at quality 70–80, or use WebP.
- Keep the **aspect ratio** listed below. The frames reserve space with
  `aspect-ratio`, so matching them avoids layout shift; `object-fit: cover` will crop
  anything that does not match.
- Keep the `width` and `height` attributes in the HTML roughly proportional to the
  real image so the browser reserves the right box.

## Expected filenames

| File | Used on | Ratio | Subject |
| --- | --- | --- | --- |
| `og-cover.jpg` | all pages (social sharing) | 1200×630 | Pine hills above the city at golden hour |
| `hero-pines.jpg` | index.html | 4:3 | Hero image — pines and ridge lines |
| `shimla-hill.jpg` | index, places | 4:3 | Shimla Hill viewpoint |
| `thandiani.jpg` | index, places | 4:3 | Mist and forest at Thandiani |
| `ilyasi-masjid.jpg` | index, places | 4:3 | Ilyasi Masjid and its spring |
| `sajikot-waterfall.jpg` | index, places | 4:3 | Sajikot Waterfall |
| `pipeline-track.jpg` | index, places | 4:3 | The Pipeline Track at Dunga Gali |
| `nathiagali.jpg` | index, places | 4:3 | Nathiagali in cloud |
| `harnoi.jpg` | places.html | 4:3 | The stream and pools at Harnoi |
| `ayubia.jpg` | places.html | 4:3 | Ayubia forest and chairlift |
| `lady-garden.jpg` | places.html | 4:3 | Lady Garden park |
| `jalal-baba-auditorium.jpg` | places.html | 4:3 | Jalal Baba Auditorium |
| `sarban-hills.jpg` | places.html | 4:3 | The city from the Sarban ridge |
| `st-lukes-church.jpg` | places.html | 4:3 | St Luke's Church |
| `karakoram-highway.jpg` | places.html | 4:3 | KKH viewpoint north of the city |
| `chapli-kabab.jpg` | food.html | 4:3 | Chapli kababs on the griddle |
| `chicken-karahi.jpg` | food.html | 4:3 | Chicken karahi in the pan |
| `dumba-karahi.jpg` | food.html | 4:3 | Dumba or mutton karahi |
| `trout.jpg` | food.html | 4:3 | Grilled hill-stream trout |
| `pink-chai.jpg` | food.html | 4:3 | Kashmiri pink chai |
| `doodh-patti.jpg` | food.html | 4:3 | Doodh patti being poured |
| `bazaar-talk.jpg` | culture.html | 4:3 | Conversation across a bazaar counter |
| `hospitality-tea.jpg` | culture.html | 4:3 | Tea tray laid out for guests |
| `festival-lights.jpg` | culture.html | 4:3 | Festival lights over a street |
| `handicrafts.jpg` | culture.html | 4:3 | Shawls, caps and woollens |
| `college-road.jpg` | culture.html | 4:3 | Students on a college road |
| `hazara-ridges.jpg` | culture.html | 4:3 | Layered ridges of the Hazara valley |
| `map-abbottabad.jpg` | contact.html | 4:3 | Static map screenshot (optional) |

### Gallery (gallery.html)

| File | Ratio | Subject |
| --- | --- | --- |
| `g-pines-golden-hour.jpg` | 4:3 | Pines above the city before sunset |
| `g-shimla-sunset.jpg` | 3:4 | Valley lights from Shimla Hill |
| `g-thandiani-snow.jpg` | 4:3 | Snow on the Thandiani road |
| `g-kachehri-bazaar.jpg` | 1:1 | Spice and dried fruit sacks |
| `g-ilyasi-spring.jpg` | 4:3 | Spring water in the mosque courtyard |
| `g-road-north.jpg` | 16:9 | The Karakoram Highway heading north |
| `g-sajikot-flood.jpg` | 3:4 | Sajikot in spring flow |
| `g-pipeline-ferns.jpg` | 4:3 | Ferns along the Pipeline Track |
| `g-chapli-griddle.jpg` | 1:1 | Chapli kababs frying |
| `g-st-lukes.jpg` | 4:3 | St Luke's Church among trees |
| `g-nathiagali-cloud.jpg` | 3:4 | Cloud in the treetops |
| `g-corn-coals.jpg` | 4:3 | Roasted corn at dusk |

The gallery lightbox uses each tile's `href` as the full-size image, so update both
the `href` on the `<a class="tile">` and the `src` on the `<img>` inside it.

## The placeholders themselves

`ph-pine.svg`, `ph-mustard.svg`, `ph-tomato.svg`, `ph-sky.svg`, `ph-lilac.svg` and
`ph-ink.svg` are flat accent blocks with a black border, generated by hand. Keep them
until every real photograph is in place — they are also handy for adding new cards.
