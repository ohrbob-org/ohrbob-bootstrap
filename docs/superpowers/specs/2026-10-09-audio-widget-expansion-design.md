# Audio Widget Expansion: Mobile Slide-Up Card Design Spec

## Goal

Enable the `<audio-widget>` custom component to expand into a high-fidelity bottom-to-top card covering approximately 80% of a mobile screen. The card displays a large cover art, complete current episode details and station, next episode details with a "Jump" trigger, previous episode details with a "Go Back" trigger, and full mirrored audio playback controls.

---

## Scope

- **In scope:**
  - Expanded card layout, glassmorphism styling, and smooth animations.
  - Interactive triggers (tapping mobile metadata/cover to expand, down-chevron to collapse).
  - JSON property setters/getters `nextEpisode` and `prevEpisode` mapping to HTML attributes `next-episode` and `prev-episode`.
  - Seamless bidirectional syncing of playback state between the collapsed bottom bar and the expanded card.
  - Clean styling in inline/showcase mode (using absolute positioning inside mockup screens).
  - Event dispatching for navigation jumps (`jumpnext`, `jumpprev`), expansions, and collapses.
  - Updating the `index.html` demo to wire up mock data and test interactivity.

- **Out of scope:**
  - Complete audio playlist queue management (the host still drives the actual track list).
  - Multi-track history lists beyond a single previous and next episode.

---

## Architecture

The `<audio-widget>` element will remain a dependency-free custom element. It handles its state through properties and schedules fine-grained DOM updaters to prevent destroying interactive elements or losing event listeners.

To maintain maximum robustness, the DOM for both the bottom bar and the expanded card is rendered once on connected or attribute changes. State properties (`isPlaying`, `currentTime`, `duration`, `volume`, `muted`) update targets in both the bottom bar and the expanded card simultaneously.

### Expanded State Trigger
The widget will track an internal boolean state `_isExpanded`.
- To open: The host element gets the `.is-expanded` class.
- Setting `widget.isExpanded = true` or `false` programmatically is supported.
- Click events on `.audio-meta` or `.track-cover` in the mobile-collapsed bar will trigger `isExpanded = true`.
- Tapping the `.js-close-expanded` close button inside the expanded card will trigger `isExpanded = false`.

### Properties & Attributes

| Property | Type | Default | Attribute | Description |
| --- | --- | --- | --- | --- |
| `nextEpisode` | `Object` | `null` | `next-episode` | Object `{ track, artist, cover, duration }` representing the next episode. |
| `prevEpisode` | `Object` | `null` | `prev-episode` | Object `{ track, artist, cover, duration }` representing the previous episode. |
| `isExpanded` | `Boolean` | `false` | (reflected) | Whether the expanded card is visible. Reflects to `.is-expanded` class. |

When attributes `next-episode` or `prev-episode` change, they are parsed as JSON and assigned to their respective properties.

---

## DOM Structure

```html
<audio-widget class="audio-widget glass-panel glass-edge">
  <!-- 1. Collapsed Player Bar (Bottom Bar) -->
  <div class="audio-bar">
    <!-- Existing elements: audio-meta, audio-controls, progress-group, volume-group, settings-button -->
  </div>

  <!-- 2. Expanded Slide-Up Card Overlay -->
  <div class="audio-expanded-card">
    <div class="expanded-header">
      <button type="button" class="btn-close-expanded js-close-expanded" aria-label="Minimize player">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <span class="expanded-header-title">Now Playing</span>
      <div style="width: 24px;"></div> <!-- Spacer for symmetry -->
    </div>

    <div class="expanded-body">
      <!-- Large Cover Art -->
      <div class="expanded-cover-container">
        <!-- Renders big cover or fallback symbol -->
      </div>

      <!-- Current Track Details -->
      <div class="expanded-info">
        <span class="expanded-station"><span class="station-dot"></span><span class="js-expanded-station-text">My Station</span></span>
        <strong class="expanded-title">Track Name</strong>
        <span class="expanded-artist">Artist</span>
      </div>

      <!-- Replicated Audio Playback Controls & Progress -->
      <div class="expanded-controls-group">
        <div class="expanded-progress-row">
          <span class="time-elapsed expanded-elapsed">0:00</span>
          <input type="range" class="audio-progress js-expanded-progress" min="0" max="0" step="0.1" value="0" aria-label="Seek">
          <span class="time-total expanded-total">0:00</span>
        </div>
        <div class="expanded-controls">
          <button type="button" class="btn btn-glass rounded-circle btn-skip js-expanded-skipback" aria-label="Skip back 15 seconds"></button>
          <button type="button" class="btn btn-glass-primary rounded-circle btn-play js-expanded-play" aria-label="Play"></button>
          <button type="button" class="btn btn-glass rounded-circle btn-skip js-expanded-skipforward" aria-label="Skip forward 30 seconds"></button>
        </div>
      </div>

      <!-- Previous Episode Navigation Row -->
      <div class="episode-nav-card prev-episode-card">
        <div class="episode-nav-label">Previous Episode</div>
        <div class="episode-nav-content">
          <!-- Small Cover -->
          <div class="episode-nav-cover-container"></div>
          <div class="episode-nav-info">
            <strong class="episode-nav-title">Previous Track Title</strong>
            <span class="episode-nav-artist">Previous Artist</span>
          </div>
          <button type="button" class="btn btn-glass-primary btn-sm btn-jump js-jump-prev">Go Back</button>
        </div>
      </div>

      <!-- Next Episode Navigation Row -->
      <div class="episode-nav-card next-episode-card">
        <div class="episode-nav-label">Next Episode</div>
        <div class="episode-nav-content">
          <!-- Small Cover -->
          <div class="episode-nav-cover-container"></div>
          <div class="episode-nav-info">
            <strong class="episode-nav-title">Next Track Title</strong>
            <span class="episode-nav-artist">Next Artist</span>
          </div>
          <button type="button" class="btn btn-glass-primary btn-sm btn-jump js-jump-next">Jump</button>
        </div>
      </div>
    </div>
  </div>
</audio-widget>
```

---

## Events

In addition to existing events (`play`, `pause`, `seek`, `skipback`, `skipforward`, `back`, `forward`), we dispatch:

| Event | `detail` | Fired when |
| --- | --- | --- |
| `jumpnext` | `{ episode }` | User taps the "Jump" button under Next Episode card. Detail contains `{ track, artist, cover, duration }`. |
| `jumpprev` | `{ episode }` | User taps the "Go Back" button under Previous Episode card. Detail contains `{ track, artist, cover, duration }`. |
| `expand` | `none` | Expanded card is opened. |
| `collapse` | `none` | Expanded card is closed. |

---

## Styling & Layout Specs

### Card Transitions & Dimensioning
- **Default (Collapsed):** `.audio-expanded-card` has `transform: translateY(105%); opacity: 0; pointer-events: none;`.
- **Expanded State:** Active when `audio-widget.is-expanded` is applied. Card transitions to `transform: translateY(0); opacity: 1; pointer-events: auto;`.
- **Transitions:** Use `transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;` for butter-smooth animation.
- **Glassmorphic appearance:**
  - `background: rgba(255, 255, 255, 0.72);`
  - Backdrop blur filter: `backdrop-filter: blur(20px) saturate(180%);`
  - Edge border: `border: 1px solid rgba(255, 255, 255, 0.4);`
  - Subtle dark drop shadow: `box-shadow: 0 -8px 32px rgba(0, 25, 87, 0.15);`

### Showcase Integration
If `.audio-widget-inline` is active:
- Mobile expanded height is constrained to `height: calc(100% - 16px)` instead of `80vh`.
- Position shifts from `fixed` to `absolute`.
- This ensures it stays bounded within the mockup box on the developer documentation showcase.

---

## Implementation Plan

1. **Design Doc Creation:** (This document)
2. **SCSS Changes:**
   - Define layout styles for `.audio-expanded-card`, `.expanded-header`, `.expanded-body`, `.expanded-cover-container`, `.expanded-info`, `.episode-nav-card`.
   - Implement fluid height positioning and transitions.
   - Adjust mobile view styles to allow expanding.
3. **JS Changes:**
   - Define getters/setters for `isExpanded`, `nextEpisode`, and `prevEpisode`.
   - Update `render()` to build both templates.
   - Implement `_apply*` state synchronizers (synchronizing elapsed progress, play/pause state across both bar controls and expanded controls).
   - Hook up close click, jump click, and metadata open click handlers.
4. **HTML Demo Update:**
   - Add sample previous and next episode JSON properties to the showcase elements in `index.html`.
   - Wire up events `jumpnext` and `jumpprev` to simulate loading the respective episodes into the player, allowing full round-trip verification of track changes.
