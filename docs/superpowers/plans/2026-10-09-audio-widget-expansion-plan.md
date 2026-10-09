# Audio Widget Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable the `<audio-widget>` custom component to expand into a high-fidelity bottom-to-top card covering approximately 80% of a mobile screen, with larger cover art, current track detail, next/previous track navigation details, and full mirrored controls.

**Architecture:** Extend `<audio-widget>` with getters/setters for `isExpanded`, `nextEpisode`, and `prevEpisode`. Update the rendering template to paint both the bottom bar and the expanded drawer. Synchronize control properties (such as timeline playback progress and play/pause state) in real time between collapsed and expanded layouts, and dispatch custom navigation events when next/previous jumps are clicked.

**Tech Stack:** Vanilla JS, CSS/SCSS (Bootstrap 5-compatible Glassmorphism styles), Node.js for tests.

## Global Constraints

- Keep the component dependency-free and lightweight.
- Preserve the existing `.audio-bar` class-based design and do not break the desktop layouts.
- Enable full absolute-position containment when the `.audio-widget-inline` class is applied to support the desktop index showcase.

---

### Task 1: Style the Expanded Card and Transitions in SCSS

**Files:**
- Modify: `scss/_audio-widget.scss`

**Interfaces:**
- Produces: CSS rules for `.audio-expanded-card`, `.expanded-header`, `.expanded-body`, `.episode-nav-card`, and their transitions when `.is-expanded` is toggled.

- [ ] **Step 1: Implement SCSS styles in `scss/_audio-widget.scss`**

We will add styling for `.audio-expanded-card` and its child elements. If `.is-expanded` is set on the host, the card slides up. On `.audio-widget-inline` widgets, the card will be positioned absolutely to remain within its desktop mockup container.

```scss
/* Add inside .audio-widget rule in scss/_audio-widget.scss, right before @mixin audio-range or at the end */

.audio-expanded-card {
  position: fixed;
  left: 8px;
  right: 8px;
  bottom: 8px;
  height: 80vh;
  max-height: 80vh;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 -8px 32px rgba(0, 25, 87, 0.15);
  
  transform: translateY(105%);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;

  .expanded-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid rgba(0, 25, 87, 0.08);

    .btn-close-expanded {
      background: transparent;
      border: none;
      color: $body-color;
      opacity: 0.6;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;

      &:hover {
        opacity: 1;
        background-color: rgba(0, 25, 87, 0.05);
      }
    }

    .expanded-header-title {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba($dark-blue, 0.6);
    }
  }

  .expanded-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    scrollbar-width: thin;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 25, 87, 0.1);
      border-radius: 2px;
    }

    .expanded-cover-container {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-bottom: 8px;

      .expanded-cover {
        width: 160px;
        height: 160px;
        border-radius: 16px;
        object-fit: cover;
        box-shadow: 0 8px 24px rgba(0, 25, 87, 0.15);
        background-color: rgba($dark-blue, 0.08);
      }

      .expanded-cover-empty {
        width: 160px;
        height: 160px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        color: rgba($dark-blue, 0.4);
        box-shadow: 0 8px 24px rgba(0, 25, 87, 0.15);
        background-color: rgba($dark-blue, 0.08);
      }
    }

    .expanded-info {
      text-align: center;
      
      .expanded-station {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: $primary;

        .station-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: $primary;
          box-shadow: 0 0 5px $primary;
        }
      }

      .expanded-title {
        display: block;
        font-size: 1.25rem;
        font-weight: 700;
        color: $dark-blue;
        margin-top: 6px;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .expanded-artist {
        display: block;
        font-size: 0.9rem;
        opacity: 0.75;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .expanded-controls-group {
      background: rgba(0, 25, 87, 0.03);
      padding: 16px;
      border-radius: 16px;
      border: 1px solid rgba(0, 25, 87, 0.04);

      .expanded-progress-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .time-elapsed, .time-total {
          font-size: 0.72rem;
          font-variant-numeric: tabular-nums;
          opacity: 0.7;
          min-width: 38px;
        }
        .time-elapsed { text-align: right; }
        .js-expanded-progress {
          @include audio-range($light-blue);
          flex: 1;
          min-width: 0;
        }
      }

      .expanded-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;

        .btn-play {
          width: 52px;
          height: 52px;
          border-radius: 50% !important;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          svg { display: block; }
        }

        .btn-skip {
          width: 38px;
          height: 38px;
          border-radius: 50% !important;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          svg { display: block; }
        }
      }
    }

    .episode-nav-card {
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(0, 25, 87, 0.06);
      border-radius: 16px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .episode-nav-label {
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba($dark-blue, 0.5);
      }

      .episode-nav-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .episode-nav-cover-container {
          width: 44px;
          height: 44px;
          flex-shrink: 0;

          .episode-nav-cover {
            width: 44px;
            height: 44px;
            border-radius: 8px;
            object-fit: cover;
          }

          .episode-nav-cover-empty {
            width: 44px;
            height: 44px;
            border-radius: 8px;
            background-color: rgba($dark-blue, 0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            color: rgba($dark-blue, 0.3);
          }
        }

        .episode-nav-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          line-height: 1.2;

          .episode-nav-title {
            font-size: 0.88rem;
            font-weight: 700;
            color: $dark-blue;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .episode-nav-artist {
            font-size: 0.78rem;
            opacity: 0.75;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .btn-jump {
          padding: 6px 14px;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 20px !important;
          flex-shrink: 0;
        }
      }
    }
  }
}

/* Active expanded state toggler class */
&.is-expanded {
  .audio-expanded-card {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
}

/* Specific inline mockup showcase adjustment */
&.audio-widget-inline {
  .audio-expanded-card {
    position: absolute;
    height: calc(100% - 16px);
    max-height: none;
    bottom: 8px;
    z-index: 100;
  }
}
```

- [ ] **Step 2: Compile the CSS**

Run: `npm run build`
Expected: Completion with no Sass errors.

---

### Task 2: Implement Properties, Render Template, and Interaction in JS

**Files:**
- Modify: `js/audio-widget.js`

**Interfaces:**
- Consumes: SCSS class definitions from Task 1.
- Produces: Web component methods, properties (`isExpanded`, `nextEpisode`, `prevEpisode`), rendering templates, synchronizers, and custom navigation events.

- [ ] **Step 1: Write the updated properties, template and logic in `js/audio-widget.js`**

Modify `js/audio-widget.js` to:
1. Define getters/setters for `isExpanded`, `nextEpisode`, and `prevEpisode`.
2. Add `'next-episode'` and `'prev-episode'` to `observedAttributes`.
3. In `attributeChangedCallback`, handle these attributes by parsing their values as JSON and assigning to their properties.
4. Update `render()` to append the card template.
5. Implement state-reflecting helper methods (`_applyDuration`, `_applyCurrentTime`, `_applyPlaying`, `_applyMuted`) to synchronizing progress bar inputs and button views inside both elements.
6. Attach event listeners for metadata tap (expand card), close click (minimize card), next/prev episode jumps, progress scrub, and skip back/forward.

```javascript
/* Complete content replacement of js/audio-widget.js: */
const ICONS = {
    play: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linejoin="round" stroke-linecap="round"><polygon points="7 4 19 12 7 20 7 4"></polygon></svg>`,
    pause: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linejoin="round" stroke-linecap="round"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>`,
    back: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linejoin="round" stroke-linecap="round"><polygon points="11 19 2 12 11 5 11 19"></polygon><polygon points="22 19 13 12 22 5 22 19"></polygon></svg>`,
    forward: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linejoin="round" stroke-linecap="round"><polygon points="13 19 22 12 13 5 13 19"></polygon><polygon points="2 19 11 12 2 5 2 19"></polygon></svg>`,
    skipBack: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path><text x="12" y="15" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" stroke="none">15</text></svg>`,
    skipForward: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path><text x="12" y="15" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" stroke="none">30</text></svg>`,
    volume: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
    muted: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
    settings: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
};

function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return '--:--';
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

class AudioWidget extends HTMLElement {
    constructor() {
        super();
        this._rendered = false;
        this._duration = 0;
        this._currentTime = 0;
        this._volume = 1;
        this._muted = false;
        this._isPlaying = false;
        this._scrubTime = null;
        
        this._isExpanded = false;
        this._nextEpisode = null;
        this._prevEpisode = null;
    }

    connectedCallback() {
        this.classList.add('audio-widget', 'glass-panel', 'glass-edge');
        this.render();
    }

    static get observedAttributes() {
        return ['station', 'track', 'artist', 'cover', 'next-episode', 'prev-episode'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        if (name === 'next-episode') {
            try {
                this._nextEpisode = newValue ? JSON.parse(newValue) : null;
            } catch (e) {
                console.error('Error parsing next-episode JSON:', e);
            }
        } else if (name === 'prev-episode') {
            try {
                this._prevEpisode = newValue ? JSON.parse(newValue) : null;
            } catch (e) {
                console.error('Error parsing prev-episode JSON:', e);
            }
        }
        
        if (this._rendered) {
            this.render();
        }
    }

    get isPlaying() { return this._isPlaying; }
    set isPlaying(value) {
        this._isPlaying = Boolean(value);
        if (this._rendered) this._applyPlaying();
    }

    get duration() { return this._duration; }
    set duration(value) {
        const next = Math.max(0, Number(value) || 0);
        if (next === this._duration) return;
        this._duration = next;
        if (this._currentTime > next) this._currentTime = next;
        if (this._rendered) {
            this._applyDuration();
            this._applyCurrentTime();
        }
    }

    get currentTime() { return this._currentTime; }
    set currentTime(value) {
        const num = Number(value);
        const next = clamp(Number.isFinite(num) ? num : 0, 0, this._duration > 0 ? this._duration : Infinity);
        if (next === this._currentTime) return;
        this._currentTime = next;
        if (this._rendered) this._applyCurrentTime();
    }

    get volume() { return this._volume; }
    set volume(value) {
        const num = Number(value);
        const next = clamp(Number.isFinite(num) ? num : 0, 0, 1);
        if (next === this._volume) return;
        this._volume = next;
        if (this._rendered) this._applyVolume();
    }

    get muted() { return this._muted; }
    set muted(value) {
        const next = Boolean(value);
        if (next === this._muted) return;
        this._muted = next;
        if (this._rendered) this._applyMuted();
    }

    get isExpanded() { return this._isExpanded; }
    set isExpanded(value) {
        const next = Boolean(value);
        if (next === this._isExpanded) return;
        this._isExpanded = next;
        if (next) {
            this.classList.add('is-expanded');
            this.dispatchEvent(new CustomEvent('expand', { bubbles: true }));
        } else {
            this.classList.remove('is-expanded');
            this.dispatchEvent(new CustomEvent('collapse', { bubbles: true }));
        }
    }

    get nextEpisode() { return this._nextEpisode; }
    set nextEpisode(value) {
        this._nextEpisode = value;
        if (this._rendered) {
            this.render();
        }
    }

    get prevEpisode() { return this._prevEpisode; }
    set prevEpisode(value) {
        this._prevEpisode = value;
        if (this._rendered) {
            this.render();
        }
    }

    render() {
        const station = this.getAttribute('station') || 'My Station';
        const track = this.getAttribute('track') || 'Track Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const cover = this.getAttribute('cover');

        const coverHtml = cover 
            ? `<img src="${cover}" alt="" class="track-cover">` 
            : `<div class="track-cover track-cover-empty">♪</div>`;

        const expandedCoverHtml = cover 
            ? `<img src="${cover}" alt="" class="expanded-cover">` 
            : `<div class="expanded-cover-empty">♪</div>`;

        // Render previous episode row block
        let prevEpisodeHtml = '';
        if (this._prevEpisode) {
            const prevCover = this._prevEpisode.cover 
                ? `<img src="${this._prevEpisode.cover}" alt="" class="episode-nav-cover">` 
                : `<div class="episode-nav-cover-empty">♪</div>`;
            prevEpisodeHtml = `
                <div class="episode-nav-card prev-episode-card">
                    <div class="episode-nav-label">Previous Episode</div>
                    <div class="episode-nav-content">
                        <div class="episode-nav-cover-container">${prevCover}</div>
                        <div class="episode-nav-info">
                            <strong class="episode-nav-title">${this._prevEpisode.track || 'Track'}</strong>
                            <span class="episode-nav-artist">${this._prevEpisode.artist || 'Artist'}</span>
                        </div>
                        <button type="button" class="btn btn-glass-primary btn-sm btn-jump js-jump-prev">Go Back</button>
                    </div>
                </div>
            `;
        }

        // Render next episode row block
        let nextEpisodeHtml = '';
        if (this._nextEpisode) {
            const nextCover = this._nextEpisode.cover 
                ? `<img src="${this._nextEpisode.cover}" alt="" class="episode-nav-cover">` 
                : `<div class="episode-nav-cover-empty">♪</div>`;
            nextEpisodeHtml = `
                <div class="episode-nav-card next-episode-card">
                    <div class="episode-nav-label">Next Episode</div>
                    <div class="episode-nav-content">
                        <div class="episode-nav-cover-container">${nextCover}</div>
                        <div class="episode-nav-info">
                            <strong class="episode-nav-title">${this._nextEpisode.track || 'Track'}</strong>
                            <span class="episode-nav-artist">${this._nextEpisode.artist || 'Artist'}</span>
                        </div>
                        <button type="button" class="btn btn-glass-primary btn-sm btn-jump js-jump-next">Jump</button>
                    </div>
                </div>
            `;
        }

        this.innerHTML = `
            <div class="audio-bar">
                <div class="audio-meta">
                    ${coverHtml}
                    <div class="audio-info">
                        <span class="station-name"><span class="station-dot"></span>${station}</span>
                        <strong class="track-title">${track}</strong>
                        <small class="track-description">${artist}</small>
                    </div>
                </div>
                <div class="audio-controls">
                    <button type="button" class="btn btn-glass rounded-circle btn-icon js-back" aria-label="Previous episode">${ICONS.back}</button>
                    <button type="button" class="btn btn-glass rounded-circle btn-skip js-skipback" aria-label="Skip back 15 seconds">${ICONS.skipBack}</button>
                    <button type="button" class="btn btn-glass-primary rounded-circle btn-play js-play" aria-label="Play">${ICONS.play}</button>
                    <button type="button" class="btn btn-glass rounded-circle btn-skip js-skipforward" aria-label="Skip forward 30 seconds">${ICONS.skipForward}</button>
                    <button type="button" class="btn btn-glass rounded-circle btn-icon js-forward" aria-label="Next episode">${ICONS.forward}</button>
                </div>
                <div class="audio-progress-group">
                    <span class="time-elapsed">--:--</span>
                    <input type="range" class="audio-progress" min="0" max="0" step="0.1" value="0" aria-label="Seek">
                    <span class="time-total">--:--</span>
                </div>
                <div class="audio-volume-group">
                    <button type="button" class="btn-mute js-mute" aria-label="Mute" aria-pressed="false">${ICONS.volume}</button>
                    <input type="range" class="audio-volume" min="0" max="1" step="0.01" value="1" aria-label="Volume">
                </div>
                <button type="button" class="btn-menu js-settings" aria-label="Settings">${ICONS.settings}</button>
            </div>

            <!-- Slide-Up Card Overlay -->
            <div class="audio-expanded-card">
                <div class="expanded-header">
                    <button type="button" class="btn-close-expanded js-close-expanded" aria-label="Minimize player">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <span class="expanded-header-title">Now Playing</span>
                    <div style="width: 24px;"></div>
                </div>
                <div class="expanded-body">
                    <div class="expanded-cover-container">
                        ${expandedCoverHtml}
                    </div>
                    <div class="expanded-info">
                        <span class="expanded-station"><span class="station-dot"></span>${station}</span>
                        <strong class="expanded-title">${track}</strong>
                        <span class="expanded-artist">${artist}</span>
                    </div>
                    <div class="expanded-controls-group">
                        <div class="expanded-progress-row">
                            <span class="time-elapsed js-expanded-elapsed">--:--</span>
                            <input type="range" class="audio-progress js-expanded-progress" min="0" max="0" step="0.1" value="0" aria-label="Seek">
                            <span class="time-total js-expanded-total">--:--</span>
                        </div>
                        <div class="expanded-controls">
                            <button type="button" class="btn btn-glass rounded-circle btn-skip js-expanded-skipback" aria-label="Skip back 15 seconds">${ICONS.skipBack}</button>
                            <button type="button" class="btn btn-glass-primary rounded-circle btn-play js-expanded-play" aria-label="Play">${ICONS.play}</button>
                            <button type="button" class="btn btn-glass rounded-circle btn-skip js-expanded-skipforward" aria-label="Skip forward 30 seconds">${ICONS.skipForward}</button>
                        </div>
                    </div>
                    ${prevEpisodeHtml}
                    ${nextEpisodeHtml}
                </div>
            </div>
        `;

        if (this._isExpanded) {
            this.classList.add('is-expanded');
        } else {
            this.classList.remove('is-expanded');
        }

        this._rendered = true;
        this.attachEvents();
        this.applyState();
    }

    applyState() {
        this._applyDuration();
        this._applyCurrentTime();
        this._applyVolume();
        this._applyMuted();
        this._applyPlaying();
    }

    _applyDuration() {
        const bar = this.querySelector('.audio-bar .audio-progress');
        const total = this.querySelector('.audio-bar .time-total');
        if (bar) bar.max = String(this._duration);
        if (total) total.textContent = formatTime(this._duration);

        // Mirrored elements
        const expBar = this.querySelector('.audio-expanded-card .js-expanded-progress');
        const expTotal = this.querySelector('.audio-expanded-card .js-expanded-total');
        if (expBar) expBar.max = String(this._duration);
        if (expTotal) expTotal.textContent = formatTime(this._duration);

        this._paintProgress();
    }

    _applyCurrentTime() {
        this._paintProgress();
    }

    _paintProgress() {
        const bar = this.querySelector('.audio-bar .audio-progress');
        const elapsed = this.querySelector('.audio-bar .time-elapsed');
        const expBar = this.querySelector('.audio-expanded-card .js-expanded-progress');
        const expElapsed = this.querySelector('.audio-expanded-card .js-expanded-elapsed');

        const shown = this._scrubTime !== null ? this._scrubTime : this._currentTime;
        const pct = this._duration > 0 ? clamp((shown / this._duration) * 100, 0, 100) : 0;

        if (bar) {
            bar.value = String(shown);
            bar.style.setProperty('--progress', `${pct}%`);
        }
        if (elapsed) elapsed.textContent = formatTime(shown);

        if (expBar) {
            expBar.value = String(shown);
            expBar.style.setProperty('--progress', `${pct}%`);
        }
        if (expElapsed) expElapsed.textContent = formatTime(shown);
    }

    _applyVolume() {
        const slider = this.querySelector('.audio-volume');
        if (!slider) return;
        slider.value = String(this._volume);
        const pct = this._volume * 100;
        slider.style.setProperty('--progress', `${pct}%`);
    }

    _applyMuted() {
        const btn = this.querySelector('.js-mute');
        if (!btn) return;
        btn.innerHTML = this._muted ? ICONS.muted : ICONS.volume;
        btn.setAttribute('aria-pressed', String(this._muted));
        btn.setAttribute('aria-label', this._muted ? 'Unmute' : 'Mute');
    }

    _applyPlaying() {
        const btn = this.querySelector('.js-play');
        const expBtn = this.querySelector('.js-expanded-play');

        if (btn) {
            btn.innerHTML = this._isPlaying ? ICONS.pause : ICONS.play;
            btn.style.paddingLeft = this._isPlaying ? '0' : '2px';
            btn.setAttribute('aria-label', this._isPlaying ? 'Pause' : 'Play');
        }

        if (expBtn) {
            expBtn.innerHTML = this._isPlaying ? ICONS.pause : ICONS.play;
            expBtn.style.paddingLeft = this._isPlaying ? '0' : '2px';
            expBtn.setAttribute('aria-label', this._isPlaying ? 'Pause' : 'Play');
        }
    }

    attachEvents() {
        // Play / Pause togglers
        const play = this.querySelector('.js-play');
        const expPlay = this.querySelector('.js-expanded-play');

        const handlePlayClick = () => {
            this.isPlaying = !this.isPlaying;
            this.dispatchEvent(new CustomEvent(this.isPlaying ? 'play' : 'pause', { bubbles: true }));
        };

        if (play) play.addEventListener('click', handlePlayClick);
        if (expPlay) expPlay.addEventListener('click', handlePlayClick);

        // Standard skips / navs
        const backBtn = this.querySelector('.js-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.dispatchEvent(new CustomEvent('back', { bubbles: true })));
        }
        const fwdBtn = this.querySelector('.js-forward');
        if (fwdBtn) {
            fwdBtn.addEventListener('click', () => this.dispatchEvent(new CustomEvent('forward', { bubbles: true })));
        }

        // Collapsed skip handlers
        const skipback = this.querySelector('.js-skipback');
        if (skipback) {
            skipback.addEventListener('click', () => this.dispatchEvent(new CustomEvent('skipback', { bubbles: true, detail: { seconds: 15 } })));
        }
        const skipforward = this.querySelector('.js-skipforward');
        if (skipforward) {
            skipforward.addEventListener('click', () => this.dispatchEvent(new CustomEvent('skipforward', { bubbles: true, detail: { seconds: 30 } })));
        }

        // Expanded skip handlers (mirrored)
        const expSkipback = this.querySelector('.js-expanded-skipback');
        if (expSkipback) {
            expSkipback.addEventListener('click', () => this.dispatchEvent(new CustomEvent('skipback', { bubbles: true, detail: { seconds: 15 } })));
        }
        const expSkipforward = this.querySelector('.js-expanded-skipforward');
        if (expSkipforward) {
            expSkipforward.addEventListener('click', () => this.dispatchEvent(new CustomEvent('skipforward', { bubbles: true, detail: { seconds: 30 } })));
        }

        const settings = this.querySelector('.js-settings');
        if (settings) {
            settings.addEventListener('click', () => this.dispatchEvent(new CustomEvent('settings', { bubbles: true })));
        }

        const coverEl = this.querySelector('.audio-bar .track-cover');
        if (coverEl) {
            coverEl.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('coverclick', { bubbles: true }));
                this.isExpanded = true;
            });
        }

        // Expand layout trigger when tapping on bottom bar meta
        const metaEl = this.querySelector('.audio-bar .audio-meta');
        if (metaEl) {
            metaEl.addEventListener('click', (e) => {
                // Prevent expanding if clicking some child anchor/button (none present currently, but safe)
                if (e.target.closest('button')) return;
                this.isExpanded = true;
            });
        }

        // Collapse close button
        const closeExpanded = this.querySelector('.js-close-expanded');
        if (closeExpanded) {
            closeExpanded.addEventListener('click', () => {
                this.isExpanded = false;
            });
        }

        // Navigation Card Jump Event Dispatches
        const jumpPrevBtn = this.querySelector('.js-jump-prev');
        if (jumpPrevBtn) {
            jumpPrevBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('jumpprev', {
                    bubbles: true,
                    detail: { episode: this._prevEpisode }
                }));
            });
        }

        const jumpNextBtn = this.querySelector('.js-jump-next');
        if (jumpNextBtn) {
            jumpNextBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('jumpnext', {
                    bubbles: true,
                    detail: { episode: this._nextEpisode }
                }));
            });
        }

        const mute = this.querySelector('.js-mute');
        if (mute) {
            mute.addEventListener('click', () => {
                this.muted = !this.muted;
                this.dispatchEvent(new CustomEvent('mutechange', { bubbles: true, detail: { muted: this._muted } }));
            });
        }

        // Progress scrubbing (Mirrored)
        const bar = this.querySelector('.audio-bar .audio-progress');
        const handleProgressInput = (inputEl) => {
            this._scrubTime = Number(inputEl.value);
            this._paintProgress();
            this.dispatchEvent(new CustomEvent('seek', { bubbles: true, detail: { time: this._scrubTime } }));
        };
        const handleProgressChange = () => {
            this._scrubTime = null;
            this._paintProgress();
        };

        if (bar) {
            bar.addEventListener('input', () => handleProgressInput(bar));
            bar.addEventListener('change', handleProgressChange);
        }

        const expBar = this.querySelector('.audio-expanded-card .js-expanded-progress');
        if (expBar) {
            expBar.addEventListener('input', () => handleProgressInput(expBar));
            expBar.addEventListener('change', handleProgressChange);
        }

        const volume = this.querySelector('.audio-volume');
        if (volume) {
            volume.addEventListener('input', () => {
                this.volume = Number(volume.value);
                this.dispatchEvent(new CustomEvent('volumechange', { bubbles: true, detail: { volume: this._volume } }));
            });
        }
    }
}

customElements.define('audio-widget', AudioWidget);
```

---

### Task 3: Write and Run Unit Tests to Validate JS/SCSS changes

**Files:**
- Modify: `test/widget.test.mjs`

- [ ] **Step 1: Write test cases covering expanded view, properties, and jump events**

Append or integrate expanded widget tests to `test/widget.test.mjs`.

```javascript
/* Complete content replacement of test/widget.test.mjs: */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mount, record } from './helpers/dom.mjs';

test('renders full-width bar structure', () => {
    const { el } = mount({ station: 'Test', track: 'T', artist: 'A' });
    const bar = el.querySelector('.audio-bar');
    assert.ok(bar);
    
    // Test groups
    const groups = [...bar.children].map(c => c.className.split(' ')[0]);
    assert.deepEqual(groups, [
        'audio-meta',
        'audio-controls',
        'audio-progress-group',
        'audio-volume-group',
        'btn-menu'
    ]);
});

test('renders expanded card structures', () => {
    const { el } = mount({ station: 'Test', track: 'T', artist: 'A' });
    const card = el.querySelector('.audio-expanded-card');
    assert.ok(card);
    
    const title = card.querySelector('.expanded-title');
    assert.equal(title.textContent, 'T');
});

test('manages isExpanded property and updates CSS classes and emits events', () => {
    const { el } = mount();
    const log = record(el, ['expand', 'collapse']);
    
    assert.equal(el.isExpanded, false);
    assert.ok(!el.classList.contains('is-expanded'));
    
    el.isExpanded = true;
    assert.equal(el.isExpanded, true);
    assert.ok(el.classList.contains('is-expanded'));
    assert.equal(log[0].type, 'expand');
    
    el.isExpanded = false;
    assert.equal(el.isExpanded, false);
    assert.ok(!el.classList.contains('is-expanded'));
    assert.equal(log[1].type, 'collapse');
});

test('parses and populates next and previous episode cards', () => {
    const nextEpisode = { track: 'Next Track', artist: 'Next Artist', duration: 1200 };
    const prevEpisode = { track: 'Prev Track', artist: 'Prev Artist', duration: 600 };
    
    const { el } = mount({
        'next-episode': JSON.stringify(nextEpisode),
        'prev-episode': JSON.stringify(prevEpisode)
    });
    
    const nextTitle = el.querySelector('.next-episode-card .episode-nav-title');
    const nextArtist = el.querySelector('.next-episode-card .episode-nav-artist');
    assert.equal(nextTitle.textContent, 'Next Track');
    assert.equal(nextArtist.textContent, 'Next Artist');
    
    const prevTitle = el.querySelector('.prev-episode-card .episode-nav-title');
    const prevArtist = el.querySelector('.prev-episode-card .episode-nav-artist');
    assert.equal(prevTitle.textContent, 'Prev Track');
    assert.equal(prevArtist.textContent, 'Prev Artist');
});

test('emits jumpnext and jumpprev events when navigation jump triggers are clicked', () => {
    const nextEpisode = { track: 'Next Track', artist: 'Next Artist' };
    const prevEpisode = { track: 'Prev Track', artist: 'Prev Artist' };
    
    const { el } = mount({
        'next-episode': JSON.stringify(nextEpisode),
        'prev-episode': JSON.stringify(prevEpisode)
    });
    const log = record(el, ['jumpnext', 'jumpprev']);
    
    const nextBtn = el.querySelector('.js-jump-next');
    nextBtn.click();
    assert.equal(log[0].type, 'jumpnext');
    assert.equal(log[0].detail.episode.track, 'Next Track');
    
    const prevBtn = el.querySelector('.js-jump-prev');
    prevBtn.click();
    assert.equal(log[1].type, 'jumpprev');
    assert.equal(log[1].detail.episode.track, 'Prev Track');
});
```

- [ ] **Step 2: Run the test suite**

Run: `npm run test`
Expected: ALL tests pass, including style tests and the newly added unit tests.

---

### Task 4: Integrate the Interactive Mobile Showcase in index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update widget markup to include prev/next episode sample details in `index.html`**

Locate the mobile widget showcase inside the container on `index.html` and define sample previous/next episode JSON representations on its attributes.

We will modify lines 298-304 in `index.html` to add the `prev-episode` and `next-episode` attributes, and we will update the script listeners to respond to `jumpnext` and `jumpprev` by dynamically loading the corresponding track state!

```html
<!-- Inside index.html, replace the mobile view audio-widget -->
<audio-widget class="audio-widget-inline audio-widget-mobile"
    id="mobile-showcase-widget"
    station="Radio 1"
    track="Cosmic Journey"
    artist="Space Explorer"
    cover="https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&q=80&w=150&h=150"
    next-episode='{"track":"Secrets of the Deep","artist":"Oceanographer","cover":"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=150&h=150","duration":3600}'
    prev-episode='{"track":"First Steps","artist":"Neil Armstrong","cover":"https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=150&h=150","duration":1800}'>
</audio-widget>
```

- [ ] **Step 2: Update Script section to wire up jump transitions dynamically in `index.html`**

Find the script section starting near line 356 in `index.html` and add custom event listener registrations.

```javascript
/* Add inside index.html's javascript loop block to handle new events: */
widgets.forEach(widget => {
    // Existing setup...

    // New Jump and expanded-state listeners
    widget.addEventListener('jumpnext', (e) => {
        console.log('Jump next triggered with', e.detail.episode);
        const ep = e.detail.episode;
        if (!ep) return;
        
        // Swap episodes: next becomes current, current becomes previous
        const currentEp = {
            track: widget.getAttribute('track'),
            artist: widget.getAttribute('artist'),
            cover: widget.getAttribute('cover'),
            duration: widget.duration
        };
        
        widget.setAttribute('track', ep.track);
        widget.setAttribute('artist', ep.artist || '');
        if (ep.cover) widget.setAttribute('cover', ep.cover);
        widget.duration = ep.duration || 1800;
        widget.currentTime = 0;
        
        widget.prevEpisode = currentEp;
        // Mock a next episode or clear it
        widget.nextEpisode = {
            track: "The Future of AI",
            artist: "Computer Scientist",
            cover: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=150&h=150",
            duration: 2400
        };
    });

    widget.addEventListener('jumpprev', (e) => {
        console.log('Jump prev triggered with', e.detail.episode);
        const ep = e.detail.episode;
        if (!ep) return;
        
        const currentEp = {
            track: widget.getAttribute('track'),
            artist: widget.getAttribute('artist'),
            cover: widget.getAttribute('cover'),
            duration: widget.duration
        };

        widget.setAttribute('track', ep.track);
        widget.setAttribute('artist', ep.artist || '');
        if (ep.cover) widget.setAttribute('cover', ep.cover);
        widget.duration = ep.duration || 1800;
        widget.currentTime = 0;
        
        widget.nextEpisode = currentEp;
        // Mock a prev episode or clear it
        widget.prevEpisode = {
            track: "Big Bang Theories",
            artist: "Astrophysicist",
            cover: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=150&h=150",
            duration: 3200
        };
    });
});
```

- [ ] **Step 3: Build CSS and perform final manual page reload and review**

Run: `npm run build`
Expected: Completion with zero errors.
