# Station, Feed & Episode Card Components

## Intent

Ohrbob has three levels of content: a **station** is a collection of feeds, a **feed** is a
podcast show, and an **episode** is a single item you play. Today the web app renders feeds
and stations with generic Bootstrap cards, so the three levels look alike and users have to
read the text to know what they are looking at.

This design gives each level its own card component with a shared visual language but an
unmistakable identity. The difference should be readable at a glance and survive being
scaled down to a narrow grid column.

The card set is part of the `ohrbob-bootstrap` theme: SCSS components, a showcase in
`index.html`, and tests. It is styling only, so `Ohrbob.Web` keeps ownership of the markup,
routing and click behaviour.

## Goals

- Three components: `.card-station`, `.card-feed`, `.card-episode`.
- Each is recognisable by **colour, icon, silhouette and content shape** — not by a label alone.
- The station card works in a 2/3/4-column grid (the primary usage, e.g. "My Stations").
- The feed card works in the Discover grid and in the share view's podcast grid.
- The episode card works as a list row, with unplayed, playing and played states.
- Consistent with the existing "Frosted Neon" tokens and typography.
- No npm dependencies. Icons come from Bootstrap Icons, which the app already loads.

## Non-goals

- No JavaScript or web component. Play/progress behaviour belongs to the app.
- No changes to `Ohrbob.Web` views in this repo. Applying the components there is a follow-up.
- No dark mode.
- No new colour variables unless a token is genuinely missing.

## Visual Language

| | Station | Feed | Episode |
|---|---|---|---|
| **Level** | collection | show | item |
| **Icon** | `bi-broadcast` | `bi-rss` | `bi-mic` |
| **Surface** | deep blue gradient (`#001957` → `#12106b` → `#544ff4`) | violet glass (`#f4f3ff`) | warm paper (`#fffaf0`) |
| **Edge** | 1px orange glow (`#ff9a00`), inner orange haze | 1px light-blue border (`#544ff4` at 28%) | 1px yellow border (`#fdb200` at 42%), 4px orange left bar |
| **Shape** | collage header over text | square cover over text | horizontal row: badge, text, play button |
| **Signature detail** | 4-up cover strip + glass count chip on the art | rss badge overhanging the cover's bottom edge | circular orange play button + optional progress bar |

The icon always sits in a coloured circular badge. Only the badge colour changes:
orange for station, light blue for feed, soft yellow for episode. The same badge position
(top-left of the collage, bottom-left of the cover, left of the row) is what makes the set
feel related.

### Type scale

Titles and supporting text run one step larger than the first mockup so the cards stay
readable at arm's length and in a four-column grid:

- Kickers: 9.5px, 700, 1.4px letter-spacing, uppercase.
- Station title 15px; feed and episode titles 13.5px.
- Station meta 11.5px; feed author 11px; feed and episode meta 10.5px.
- Station count chip 10px.

## Component Contracts

All components are self-contained containers. The root is always a non-interactive
`<div>`; card navigation is provided by an `<a class="stretched-link">` (Bootstrap's
utility) inside the title, so a card can contain buttons without invalid nesting or
ambiguous tap targets. The component CSS raises `.card-feed-add` and `.card-episode-play`
above the stretched link and gives linked titles a `:focus-visible` ring. `h-100` may be
added to the root when used in a Bootstrap grid row; the root is `position: relative` so
`stretched-link` works.

Icons are decorative and must be marked `aria-hidden="true"`.

### 1. Station card

Markup:

```html
<div class="card-station">
  <div class="card-station-art">
    <img class="card-station-cover" src="..." alt="">
    <img class="card-station-cover" src="..." alt="">
    <img class="card-station-cover" src="..." alt="">
    <img class="card-station-cover" src="..." alt="">
    <span class="card-station-badge" aria-hidden="true">
      <i class="bi bi-broadcast"></i>
    </span>
    <span class="card-station-count">4 podcasts</span>
  </div>
  <div class="card-station-body">
    <i class="bi bi-soundwave card-station-watermark" aria-hidden="true"></i>
    <div class="card-station-kicker">
      <i class="bi bi-broadcast" aria-hidden="true"></i> Station
    </div>
    <h3 class="card-station-title"><a class="stretched-link" href="...">Laberpodcasts</a></h3>
    <p class="card-station-meta"><strong>411</strong> episodes · Kai</p>
  </div>
</div>
```

Empty state, rendered by the app when the station has no feeds:

```html
<div class="card-station is-empty">
  <div class="card-station-art">
    <div class="card-station-cover card-station-cover-empty" aria-hidden="true">?</div>
    <span class="card-station-badge" aria-hidden="true"><i class="bi bi-broadcast"></i></span>
    <span class="card-station-count">0 podcasts</span>
  </div>
  <div class="card-station-body">...</div>
</div>
```

Behaviour of the parts:

- `.card-station-art` is a flex row of equal-width covers, 72px tall, 1px gaps. Any number
  from one to four covers fills the width; no special class is needed for fewer covers.
- A dark top band scrim covers the full width of the collage and fades out by ~60% height,
  so both the top-left badge and the top-right count chip stay legible on bright artwork.
- `.card-station-badge`: 26px orange circle, 1px translucent white ring, orange glow.
- `.card-station-count`: glass chip (dark translucent, blurred) at top-right, e.g.
  `4 podcasts`. Singular form is the app's job.
- `.card-station-title`: one line, ellipsis. Contains the stretched link when the card is
  navigable.
- `.card-station-meta`: owner and episode count, low-contrast white.
- `.card-station-watermark`: decorative `bi-soundwave` icon in the body's bottom-right
  corner at low opacity. It is a real element rather than a pseudo-element so the SCSS has
  no dependency on the icon font.
- Hover: lift 2px and strengthen the orange glow. Transition ≤ 200ms.
- Empty station (`.is-empty`): `.card-station-cover-empty` replaces the covers — a single
  full-width block with the station's initial on a blue-to-orange gradient. The count chip
  reads `0 podcasts`. The initial is a text node supplied by the app; the showcase uses a
  text node.

### 2. Feed card

Markup:

```html
<div class="card-feed">
  <div class="card-feed-art">
    <img class="card-feed-cover" src="..." alt="">
    <span class="card-feed-badge" aria-hidden="true">
      <i class="bi bi-rss"></i>
    </span>
    <button class="card-feed-add" type="button" aria-label="Add to a station">
      <i class="bi bi-plus-lg" aria-hidden="true"></i>
    </button>
  </div>
  <div class="card-feed-body">
    <div class="card-feed-kicker">
      <i class="bi bi-rss" aria-hidden="true"></i> Feed
    </div>
    <h3 class="card-feed-title"><a class="stretched-link" href="...">Kalk &amp; Welk</a></h3>
    <p class="card-feed-author">Die fabelhaften Boomer Boys</p>
    <p class="card-feed-meta">104 episodes · Updated 12 Nov</p>
  </div>
</div>
```

Missing cover, rendered by the app:

```html
<div class="card-feed-art">
  <div class="card-feed-cover card-feed-cover-empty" aria-hidden="true">K</div>
  <span class="card-feed-badge" aria-hidden="true"><i class="bi bi-rss"></i></span>
</div>
```

- Cover is square, cropped with `object-fit: cover`, with the card's top corners.
- `.card-feed-badge`: 30px light-blue circle overlapping the cover's bottom-left corner by
  ~15px, with a 2px white ring. The body's top padding leaves room for it.
- `.card-feed-add` is optional (Discover uses it): 44px orange circle, absolutely positioned
  top-right of the art, white plus icon. It is a real `<button>` with its own `aria-label`,
  raised above the stretched link with `position: relative; z-index: 2`.
- Title and author are one line with ellipsis; meta wraps to two lines maximum.
- Hover: lift 2px, border moves to 50% light blue, shadow warms toward violet.
- Missing cover: `.card-feed-cover-empty` is a violet-to-blue gradient block with the show's
  initial in white, keeping the cover's square aspect ratio and the same badge.

### 3. Episode card

Markup:

```html
<div class="card-episode is-playing has-progress">
  <span class="card-episode-badge" aria-hidden="true">
    <i class="bi bi-mic"></i>
  </span>
  <div class="card-episode-body">
    <div class="card-episode-kicker">
      <i class="bi bi-mic" aria-hidden="true"></i> Episode
    </div>
    <h3 class="card-episode-title"><a class="stretched-link" href="...">Folge 104: Warum wir immer noch über Boomer reden</a></h3>
    <p class="card-episode-meta">Kalk &amp; Welk · 12 Nov · 22 min left</p>
    <div class="card-episode-progress" role="progressbar"
         aria-valuemin="0" aria-valuemax="100" aria-valuenow="38">
      <span style="width: 38%"></span>
    </div>
  </div>
  <button class="card-episode-play" type="button" aria-label="Pause episode">
    <i class="bi bi-pause-fill" aria-hidden="true"></i>
  </button>
</div>
```

- Default (unplayed): 34px soft-yellow circle with a warm-brown mic, orange 4px left bar,
  orange play button, no progress bar.
- `.is-playing`: slightly warmer background and stronger warm shadow; the play button shows
  `bi-pause-fill` and `aria-label="Pause episode"`.
- `.is-played`: neutral background and border, muted badge and kicker, dimmed title, and a
  36px neutral circle showing `bi-check-lg` with `aria-label="Play again"`. No progress bar.
- The play button is a 40px orange circle in the default and playing states.
- Progress is independent of playback state: `.card-episode-progress` is visible whenever
  the row has `.has-progress`, and hidden otherwise. That way a paused episode keeps its
  progress bar. `.is-playing` uses `.has-progress` too, but the bar is not removed by
  pausing.
- `.card-episode-progress`: 3px track, light-blue-to-yellow fill, rounded. Width comes from
  the inline style on the inner `<span>`; the app sets `aria-valuenow`.
- The title is truncated to one line at ≥ 768px and two lines below that.
- `.card-episode-play` is always a real `<button>`; only its icon, `aria-label` and styling
  change with state. It is raised above the stretched link with `position: relative;
  z-index: 2`.
- The cover image is deliberately absent. The mic badge replaces it, which is what keeps
  the row visually distinct from a feed.
- Below 576px the kicker is hidden; the row keeps its horizontal layout and the play button
  keeps its 40px size.

## Responsive Behaviour

- Gaps and grid columns come from Bootstrap (`row-cols-*`). The cards themselves are fluid
  and have no fixed widths.
- Station art is always 72px tall; the body adapts.
- Feed cover scales with the column; title/author ellipsis.
- Episode rows stay horizontal at all widths; only the kicker and button size change.

## Files

- `scss/_cards.scss` — all three components, imported from `scss/theme.scss` after
  `_glass.scss` so shared tokens/mixins are available.
- `scss/theme.scss` — add `@import "cards";`.
- `index.html` — add a Bootstrap Icons CDN `<link>` (the same one `Ohrbob.Web` loads) so
  badges, kickers and watermarks render in the showcase. Then add a "Card Components"
  section (before the existing generic Components block) showing: a four-card station grid
  (including the empty state), a three-card feed row (including a missing cover), and an
  episode list with unplayed, playing and played examples, each with a markup snippet.
  The icon font remains an external app asset; nothing is bundled or copied by
  `apply-theme.sh`.
- `test/cards.test.mjs` — tests, following the existing node:test + jsdom helpers.

## Tests

Keep these behavioural rather than pixel-perfect:

1. Compiled CSS contains `.card-station`, `.card-feed`, `.card-episode`, the fallback
   classes, `.has-progress`, and the two episode state selectors.
2. In jsdom with the compiled theme applied:
   - station art lays its covers out in a row (`display: flex`);
   - station badge is circular (`border-radius: 50%`) and orange;
   - feed cover is square (`aspect-ratio: 1 / 1` or width == height);
   - episode root is a flex row and has a 4px left border;
   - `.is-played` lowers the title opacity relative to the default;
   - `.has-progress .card-episode-progress` is visible while a row without `.has-progress`
     hides it.
3. The showcase markup in `index.html` contains all three card classes, both episode state
   modifiers, `.has-progress`, and the icon CDN link, so the docs cannot silently drift from
   the components.

## Decisions Made Here (check these while reading)

- Class naming uses a `card-<type>` root plus `card-<type>-<part>` element classes.
  Bootstrap utilities remain available for layout.
- Card roots are non-interactive `<div>`s; navigation uses a `stretched-link` anchor in the
  title, which keeps inner buttons valid and keyboard-reachable.
- The station card gets the dark surface and the feed/episode cards stay light. This was
  chosen from the visual exploration; it makes stations the anchor of a page.
- Icons: `bi-broadcast`, `bi-rss`, `bi-mic`. A feed *is* an RSS feed, and an episode is one
  thing to listen to.
- The episode card has no artwork. The mic badge is the differentiator and keeps rows
  compact.
- Progress uses its own `.has-progress` modifier so pausing does not erase progress.
- A played episode keeps its button (check icon, `aria-label="Play again"`) so it can be
  replayed.
- `card-feed-add` is included as part of the component because Discover already shows a
  plus button; it is optional in markup.
- The kicker (`Station` / `Feed` / `Episode`) is visible text, not only an icon. It is the
  fallback when colour is unavailable.
- Accent orange for actions and badges is `$primary` / `#fc5d00`. The station edge glow uses
  `$orange-light` / `#ff9a00`.
- Fallbacks are markup elements with dedicated classes (`.card-station-cover-empty`,
  `.card-feed-cover-empty`) rather than generated images, so the app controls the content
  and the theme only styles it.

## Left to the Builder

- Exact spacing, border radii and shadow values, as long as they match the mockups'
  proportions and the existing glass aesthetic.
- Whether the station scrim uses a gradient pseudo-element or a background layer.
- Snippet wording on the showcase page.
- Test helper details.
