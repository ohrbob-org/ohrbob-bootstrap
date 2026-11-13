# Audio Widget: Full-Width Bottom Bar

## Goal

Replace the floating 300px bottom-right audio card with a full-width player bar docked to the bottom of the viewport, containing (left to right): cover art, title and description, playback controls, elapsed time, progress bar, total episode length, volume controls.

## Scope

In scope: layout, styling, the new playback-state properties, the seek/volume/mute/skip interactions, and the demo page in `index.html`.

Out of scope: buffering indicators, playback speed, queue/playlist UI, sleep timer, chapter markers. The widget still does not own an `<audio>` element — the host application owns playback and feeds state into the widget.

## Architecture

The widget stays a vanilla custom element with no dependencies. It is a *dumb* component: it renders and emits events, and never touches an audio element itself.

The existing `render()` rewrites `innerHTML` wholesale. That is unacceptable once progress updates arrive ~4x/second during playback, because it destroys DOM nodes mid-interaction (killing slider drags and button focus) and re-attaches listeners on every tick.

New structure:

- `render()` builds the full markup once, on connect and on metadata attribute change only. It contains no state-dependent values beyond the initial paint.
- State lives in JS properties. Each setter calls a small targeted updater that touches only the one to three nodes it owns.
- Event listeners are attached once per element instance and never replaced, because no listener is removed from inside the DOM that `render()` replaces.

### State

Properties, not attributes. Attributes are not reflected back to the DOM, so a per-tick progress update never triggers `attributeChangedCallback` and never causes a re-render.

| Property | Type | Default | Notes |
| --- | --- | --- | --- |
| `duration` | number (seconds) | `0` | Total episode length |
| `currentTime` | number (seconds) | `0` | Clamped to `[0, duration]` when `duration > 0` |
| `volume` | number `0`–`1` | `1` | Clamped |
| `muted` | boolean | `false` | |
| `isPlaying` | boolean | `false` | Existing field, retained |

Private state:

- `scrubTime` (`number` or `null`) — assigned from the progress range's `input` event while the user drags, so the thumb follows the pointer without waiting for the host to round-trip `currentTime`. Cleared on `change`, which the browser fires when the drag or arrow-key sequence ends.

Because the progress range is a native control with `max` bound to `duration`, the `input` value is already a time in seconds and needs no pointer arithmetic or `setPointerCapture` handling.

### Attributes

The compact bar displays only `cover`. The `station`, `track` and `artist`
attributes remain available for the expanded player view.

Time formatting is a single `formatTime(seconds)` helper: `--:--` for `0`, `null`, `NaN`, or negative input; `h:mm:ss` at one hour and above; `m:ss` below that. Minutes and seconds are zero-padded to two digits.

## DOM structure

```html
<audio-widget class="audio-widget glass-panel glass-edge">
  <div class="audio-bar">
    <div class="audio-meta">
      <img class="track-cover" src="..." alt="">
    </div>

    <div class="audio-controls">
      <button class="btn btn-glass rounded-circle btn-icon js-back" aria-label="Previous episode">…</button>
      <button class="btn btn-glass rounded-circle btn-skip js-skipback" aria-label="Skip back 15 seconds">…</button>
      <button class="btn btn-glass-primary rounded-circle btn-play js-play" aria-label="Play">…</button>
      <button class="btn btn-glass rounded-circle btn-skip js-skipforward" aria-label="Skip forward 30 seconds">…</button>
      <button class="btn btn-glass rounded-circle btn-icon js-forward" aria-label="Next episode">…</button>
    </div>

    <div class="audio-progress-group">
      <span class="time-elapsed">0:00</span>
      <input type="range" class="audio-progress" min="0" max="0" step="0.1" value="0" aria-label="Seek">
      <span class="time-total">0:00</span>
    </div>

    <div class="audio-volume-group">
      <button class="btn-mute js-mute" aria-label="Mute" aria-pressed="false">…</button>
      <input type="range" class="audio-volume" min="0" max="1" step="0.01" value="1" aria-label="Volume">
    </div>

    <button class="btn-menu js-settings" aria-label="Settings">…</button>
  </div>
</audio-widget>
```

Control order is `back · skipback · play · skipforward · forward`: track navigation on the outside, the skip buttons flanking play, which is the podcast convention.

The meta area holds only the cover art. The widget is a compact transport bar; station, title and artist are shown elsewhere in the host app.

Both sliders are native `<input type="range">` elements. This gives pointer drag, touch, and keyboard arrow support from the browser rather than from hand-written handlers, and gives screen readers correct semantics for free.

## Events

All are bubbling `CustomEvent`s dispatched from the element.

Retained: `play`, `pause`, `back`, `forward`, `settings`.

New:

| Event | `detail` | Fired when |
| --- | --- | --- |
| `seek` | `{ time }` | Progress bar is dragged or clicked; continuously during the drag |
| `volumechange` | `{ volume }` | Volume slider moves |
| `mutechange` | `{ muted }` | Mute button is toggled |
| `skipback` | `{ seconds: 15 }` | Skip-back button is pressed |
| `skipforward` | `{ seconds: 30 }` | Skip-forward button is pressed |

The widget never seeks itself. On `seek` the host seeks its audio element and writes the resulting `currentTime` back to the widget. `scrubTime` makes the visual position independent of that round-trip.

The `currentTime` updater writes three things and nothing else: the progress range's `value` (skipped while `scrubTime` is active), the `--progress` custom property, and `.time-elapsed`'s text. The `duration` updater writes the range's `max`, `--progress`, and `.time-total`'s text.

Muting does not change `volume`. The volume slider keeps showing the stored level while muted; only the speaker icon and `aria-pressed` change. This way unmuting restores the previous level, which is what listeners expect.

## Styling

### Bar container

```scss
.audio-widget {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  padding: 10px 16px;
  border-radius: 16px;
  z-index: 1050;   // unchanged: above bootstrap modals/navs
}
```

Inset from all three edges rather than flush, so the bar keeps the floating glass-pill look of the current card. It overlays page content; hosts that need the last row of content visible add their own bottom padding.

### Row layout

`.audio-bar` is a single flex row, `align-items: center`, `gap: 12px`.

| Group | Flex | Behaviour |
| --- | --- | --- |
| `.audio-meta` | `0 0 auto` | Cover art only |
| `.audio-controls` | `0 0 auto` | Fixed-size buttons, `gap: 4px`, never shrinks |
| `.audio-progress-group` | `1 1 auto` | Takes all remaining space; `min-width: 120px` |
| `.audio-volume-group` | `0 0 auto` | |
| `.btn-menu` | `0 0 auto` | |

`.audio-progress-group` is itself a flex row (`gap: 10px`) with the range set to `flex: 1`.

Cover art is 56px square with an 8px radius and `object-fit: cover`. The play button is the
largest control at 56px (52px below 768px) with a 24px icon; the skip and icon buttons stay
32–34px.

### Range sliders

Both ranges are themed, not native-looking:

- Track height 4px, radius 2px, background `rgba(0, 25, 87, 0.12)`.
- Thumb 12px circle, white fill, `1px solid rgba(0, 25, 87, 0.2)` border, subtle shadow, grows to 14px on hover/focus.
- The filled portion is driven by a `--progress` custom property set from JS as a percentage string.
  - WebKit / Blink: `::-webkit-slider-runnable-track` gets `linear-gradient(to right, $fill 0 var(--progress), rgba(0,25,87,0.12) var(--progress) 100%)`.
  - Firefox: `::-moz-range-progress` gets the fill color directly; `::-moz-range-track` stays transparent.
- Focus ring via `:focus-visible` only, so mouse users do not see an outline.

Fill colors: progress bar uses `$light-blue` (`#544ff4`), volume uses `$strong-orange` (`#fc5d00`) to match the existing play button. Note that in this theme `$primary` is aliased to `$strong-orange`, so `$light-blue` is the blue option, not `$primary`. Unfilled track is `rgba($dark-blue, 0.12)`.

### Responsive collapse

Single row at all widths; content sheds rather than wrapping.

Below `768px`:

- `.js-back` and `.js-forward` hidden — the podcast skip buttons remain, which is the mobile control set.
- `.audio-volume` hidden, `.js-mute` kept.
- Cover art 40px, play button 40px, skip buttons 30px, bar `gap: 10px`, padding `10px 12px`.
- `.audio-progress-group` `min-width` drops to 80px.

Below `420px`:

- `.time-total` hidden, leaving elapsed time and the bar.
- Time labels drop to 0.65rem.

## Demo page

`index.html` gets an updated usage snippet showing the new properties and the full event list, and its descriptive paragraph changes from "fixed to hover over the UI at the bottom right" to describing the full-width bottom bar.

The demo element is given sample state so the bar is not permanently at `0:00` when opened: `duration` is set to `2532` (42:12) and a 1-second `setInterval` advances `currentTime` by one second whenever `isPlaying` is true, stopping at `duration`. The interval is cleared on `pause`. This is demo-page-only scaffolding; it is not part of the widget.

## Files changed

- `js/audio-widget.js` — properties, targeted updaters, new controls, range interaction, `formatTime` helper, icon constants moved out of the duplicated inline strings.
- `scss/_audio-widget.scss` — bar container, flex row, range theming, responsive collapse.
- `index.html` — demo snippet, prose, and sample state wiring.

## Verification

There is no test framework in this repository and adding one is out of scope, so verification is build plus manual browser checks.

Build:

```bash
npm run build
```

Must complete with no Sass errors, and `css/theme.css` must contain the new `.audio-bar`, `.audio-progress`, and `.audio-volume` rules.

Manual checklist on `index.html`:

1. Bar spans the window width, inset from the left, right, and bottom edges, and floats above page content.
2. Groups appear in order: art, title/description, controls, elapsed, bar, total, mute icon, volume slider, gear.
3. Clicking play toggles the icon and emits `play`/`pause`; padding optical-centering for the play triangle is preserved.
4. Skip-back and skip-forward emit `skipback` `{seconds:15}` and `skipforward` `{seconds:30}`.
5. Dragging the progress bar moves the thumb immediately and emits `seek` continuously with the correct `time`; releasing leaves the thumb where it was released.
6. Keyboard arrows on the progress bar and volume slider work.
7. The mute button swaps the speaker icon, sets `aria-pressed`, and emits `mutechange`.
8. Dragging the volume slider emits `volumechange`.
9. Time labels show `--:--` before a duration is known and switch to `m:ss`, or `h:mm:ss` past one hour.
10. Setting `currentTime`/`duration`/`volume`/`muted` from the console updates only the affected nodes, with no flicker and no lost focus.
11. At 375px width: station line, prev/next, and volume slider are gone; skip buttons and mute icon remain; nothing overflows horizontally.