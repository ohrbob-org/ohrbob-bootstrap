# Audio Widget Full-Width Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the floating 300px bottom-right audio card with a full-width player bar docked to the bottom of the viewport with advanced playback and volume controls.

**Architecture:** A vanilla HTML custom element (`<audio-widget>`) maintaining a dumb-component contract. The DOM is rendered exactly once on load. State (progress, volume, muted) lives in JS properties, and their setters run fine-grained DOM updaters rather than triggering full re-renders to ensure no listener leaks or lost interactions at 4+ updates a second.

**Tech Stack:** Vanilla JavaScript, JSDOM for testing, Node:Test, Sass (SCSS) for styling.

## Global Constraints

- No additional frameworks or dependencies beyond `jsdom` (already installed in node_modules)
- TDD required: run failing tests, add minimal implementation, verify pass.
- CSS classes follow Bootstrap patterns.
- No `TBD` or `TODO` placeholders.

---

### Task 1: Test infrastructure and DOM helpers

**Files:**
- Create: `test/helpers/dom.mjs`
- Create: `test/helpers/styles.mjs`
- Create: `test/harness.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `mount(attributes)` for use in all DOM tests.
- Produces: `compileTheme()` for use in style tests.

- [ ] **Step 1: Set up the test script in package.json**
Modify `package.json` to add the test script:
```json
  "scripts": {
    "build": "sass --quiet-deps scss/theme.scss css/theme.css",
    "watch": "sass --watch --quiet-deps scss/theme.scss css/theme.css",
    "test": "node --test test/"
  },
```

- [ ] **Step 2: Write the DOM helper**
Create `test/helpers/dom.mjs`:
```javascript
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const here = path.dirname(fileURLToPath(import.meta.url));
const widgetSource = readFileSync(path.join(here, '..', '..', 'js', 'audio-widget.js'), 'utf8');

export function createDom() {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only' });
    dom.window.eval(widgetSource);
    return dom;
}

export function mount(attributes = {}) {
    const dom = createDom();
    const el = dom.window.document.createElement('audio-widget');
    for (const [name, value] of Object.entries(attributes)) {
        el.setAttribute(name, value);
    }
    dom.window.document.body.appendChild(el);
    return { dom, window: dom.window, document: dom.window.document, el };
}

export function record(el, types) {
    const log = [];
    for (const type of types) {
        el.addEventListener(type, (e) => log.push({ type, detail: e.detail }));
    }
    return log;
}
```

- [ ] **Step 3: Write the SCSS compiler helper**
Create `test/helpers/styles.mjs`:
```javascript
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as sass from 'sass';
import { JSDOM } from 'jsdom';
import { createDom } from './dom.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..', '..');

export function compileTheme() {
    const result = sass.compile(path.join(repoRoot, 'scss', 'theme.scss'), {
        loadPaths: [path.join(repoRoot, 'node_modules')],
        logger: sass.Logger.silent,
    });
    return result.css;
}

export function createStyledDom() {
    const css = compileTheme();
    const dom = createDom();
    const style = dom.window.document.createElement('style');
    style.textContent = css;
    dom.window.document.head.appendChild(style);
    
    const el = dom.window.document.createElement('audio-widget');
    dom.window.document.body.appendChild(el);
    
    return { dom, window: dom.window, document: dom.window.document, el };
}
```

- [ ] **Step 4: Write a smoke test**
Create `test/harness.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mount } from './helpers/dom.mjs';
import { createStyledDom } from './helpers/styles.mjs';

test('DOM helper mounts the widget', () => {
    const { el } = mount();
    assert.ok(el.classList.contains('audio-widget'), 'Element was upgraded');
});

test('Styles helper can compile and inject CSS', () => {
    const { window, el } = createStyledDom();
    const display = window.getComputedStyle(el).display;
    assert.ok(typeof display === 'string', 'CSS was parsed');
});
```

- [ ] **Step 5: Run tests to verify setup**
Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add package.json package-lock.json test/
git commit -m "test: add jsdom test infrastructure"
```

### Task 2: Widget Rendering and Event Updates

**Files:**
- Modify: `js/audio-widget.js`
- Create: `test/widget.test.mjs`

- [ ] **Step 1: Write test for new DOM structure**
Create `test/widget.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mount } from './helpers/dom.mjs';

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
```

- [ ] **Step 2: Run test (fail)**
Run: `npm test`
Expected: FAIL

- [ ] **Step 3: Implement new JS render logic**
Update `js/audio-widget.js` to implement properties, the `render` method, and `_apply*` updates:
```javascript
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
    return h > 0 ? \`\${h}:\${pad(m)}:\${pad(s)}\` : \`\${m}:\${pad(s)}\`;
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
    }

    connectedCallback() {
        this.classList.add('audio-widget', 'glass-panel', 'glass-edge');
        this.render();
    }

    static get observedAttributes() {
        return ['station', 'track', 'artist', 'cover'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this._rendered) {
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

    render() {
        const station = this.getAttribute('station') || 'My Station';
        const track = this.getAttribute('track') || 'Track Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const cover = this.getAttribute('cover');

        const coverHtml = cover 
            ? \`<img src="\${cover}" alt="" class="track-cover">\` 
            : \`<div class="track-cover track-cover-empty">♪</div>\`;

        this.innerHTML = \`
            <div class="audio-bar">
                <div class="audio-meta">
                    \${coverHtml}
                    <div class="audio-info">
                        <span class="station-name"><span class="station-dot"></span>\${station}</span>
                        <strong class="track-title">\${track}</strong>
                        <small class="track-description">\${artist}</small>
                    </div>
                </div>
                <div class="audio-controls">
                    <button type="button" class="btn btn-glass rounded-circle btn-icon js-back" aria-label="Previous episode">\${ICONS.back}</button>
                    <button type="button" class="btn btn-glass rounded-circle btn-skip js-skipback" aria-label="Skip back 15 seconds">\${ICONS.skipBack}</button>
                    <button type="button" class="btn btn-glass-primary rounded-circle btn-play js-play" aria-label="Play">\${ICONS.play}</button>
                    <button type="button" class="btn btn-glass rounded-circle btn-skip js-skipforward" aria-label="Skip forward 30 seconds">\${ICONS.skipForward}</button>
                    <button type="button" class="btn btn-glass rounded-circle btn-icon js-forward" aria-label="Next episode">\${ICONS.forward}</button>
                </div>
                <div class="audio-progress-group">
                    <span class="time-elapsed">--:--</span>
                    <input type="range" class="audio-progress" min="0" max="0" step="0.1" value="0" aria-label="Seek">
                    <span class="time-total">--:--</span>
                </div>
                <div class="audio-volume-group">
                    <button type="button" class="btn-mute js-mute" aria-label="Mute" aria-pressed="false">\${ICONS.volume}</button>
                    <input type="range" class="audio-volume" min="0" max="1" step="0.01" value="1" aria-label="Volume">
                </div>
                <button type="button" class="btn-menu js-settings" aria-label="Settings">\${ICONS.settings}</button>
            </div>
        \`;

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
        const bar = this.querySelector('.audio-progress');
        const total = this.querySelector('.time-total');
        if (!bar || !total) return;
        bar.max = String(this._duration);
        total.textContent = formatTime(this._duration);
        this._paintProgress();
    }

    _applyCurrentTime() {
        this._paintProgress();
    }

    _paintProgress() {
        const bar = this.querySelector('.audio-progress');
        const elapsed = this.querySelector('.time-elapsed');
        if (!bar || !elapsed) return;
        const shown = this._scrubTime !== null ? this._scrubTime : this._currentTime;
        bar.value = String(shown);
        const pct = this._duration > 0 ? clamp((shown / this._duration) * 100, 0, 100) : 0;
        bar.style.setProperty('--progress', \`\${pct}%\`);
        elapsed.textContent = formatTime(shown);
    }

    _applyVolume() {
        const slider = this.querySelector('.audio-volume');
        if (!slider) return;
        slider.value = String(this._volume);
        const pct = this._volume * 100;
        slider.style.setProperty('--progress', \`\${pct}%\`);
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
        if (!btn) return;
        btn.innerHTML = this._isPlaying ? ICONS.pause : ICONS.play;
        btn.style.paddingLeft = this._isPlaying ? '0' : '2px';
        btn.setAttribute('aria-label', this._isPlaying ? 'Pause' : 'Play');
    }

    attachEvents() {
        const play = this.querySelector('.js-play');
        play.addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            this.dispatchEvent(new CustomEvent(this.isPlaying ? 'play' : 'pause', { bubbles: true }));
        });

        this.querySelector('.js-back').addEventListener('click', () => this.dispatchEvent(new CustomEvent('back', { bubbles: true })));
        this.querySelector('.js-forward').addEventListener('click', () => this.dispatchEvent(new CustomEvent('forward', { bubbles: true })));
        this.querySelector('.js-skipback').addEventListener('click', () => this.dispatchEvent(new CustomEvent('skipback', { bubbles: true, detail: { seconds: 15 } })));
        this.querySelector('.js-skipforward').addEventListener('click', () => this.dispatchEvent(new CustomEvent('skipforward', { bubbles: true, detail: { seconds: 30 } })));
        this.querySelector('.js-settings').addEventListener('click', () => this.dispatchEvent(new CustomEvent('settings', { bubbles: true })));

        const mute = this.querySelector('.js-mute');
        mute.addEventListener('click', () => {
            this.muted = !this.muted;
            this.dispatchEvent(new CustomEvent('mutechange', { bubbles: true, detail: { muted: this._muted } }));
        });

        const bar = this.querySelector('.audio-progress');
        bar.addEventListener('input', () => {
            this._scrubTime = Number(bar.value);
            this._paintProgress();
            this.dispatchEvent(new CustomEvent('seek', { bubbles: true, detail: { time: this._scrubTime } }));
        });
        bar.addEventListener('change', () => {
            this._scrubTime = null;
            this._paintProgress();
        });

        const volume = this.querySelector('.audio-volume');
        volume.addEventListener('input', () => {
            this.volume = Number(volume.value);
            this.dispatchEvent(new CustomEvent('volumechange', { bubbles: true, detail: { volume: this._volume } }));
        });
    }
}

customElements.define('audio-widget', AudioWidget);
```

- [ ] **Step 4: Run tests**
Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add js/audio-widget.js test/widget.test.mjs
git commit -m "feat: complete rendering logic and interaction logic"
```

### Task 3: SCSS Layout

**Files:**
- Modify: `scss/_audio-widget.scss`
- Create: `test/style.test.mjs`

- [ ] **Step 1: Write test for final styling layout**
Create `test/style.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStyledDom, compileTheme } from './helpers/styles.mjs';

test('widget displays horizontally at bottom', () => {
    const { el, window } = createStyledDom();
    const style = window.getComputedStyle(el);
    assert.equal(style.position, 'fixed');
    assert.equal(style.left, '16px');
    assert.equal(style.bottom, '16px');
    
    const bar = window.getComputedStyle(el.querySelector('.audio-bar'));
    assert.equal(bar.display, 'flex');
});

test('media queries exist in compiled CSS', () => {
    const css = compileTheme();
    assert.ok(css.includes('@media (max-width: 767.98px)'));
    assert.ok(css.includes('@media (max-width: 419.98px)'));
});
```

- [ ] **Step 2: Run test (fail)**
Run: `npm test`
Expected: FAIL

- [ ] **Step 3: Implement new SCSS**
Overwrite `scss/_audio-widget.scss`:
```scss
@mixin audio-range($fill) {
  -webkit-appearance: none;
  appearance: none;
  height: 16px;
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(to right,
      $fill 0 var(--progress, 0%),
      rgba($dark-blue, 0.12) var(--progress, 0%) 100%);
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    margin-top: -4px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid rgba(0, 25, 87, 0.2);
    box-shadow: 0 1px 3px rgba(0, 25, 87, 0.25);
    transition: transform 0.15s ease;
  }

  &::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: rgba($dark-blue, 0.12);
  }

  &::-moz-range-progress {
    height: 4px;
    border-radius: 2px;
    background: $fill;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid rgba(0, 25, 87, 0.2);
    box-shadow: 0 1px 3px rgba(0, 25, 87, 0.25);
  }

  &:hover::-webkit-slider-thumb,
  &:focus-visible::-webkit-slider-thumb { transform: scale(1.15); }
  &:hover::-moz-range-thumb,
  &:focus-visible::-moz-range-thumb { transform: scale(1.15); }

  &:focus { outline: none; }
  &:focus-visible { outline: 2px solid rgba($light-blue, 0.6); outline-offset: 2px; }
}

.audio-widget {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  padding: 10px 16px;
  border-radius: 16px;
  z-index: 1050;
  transition: all 0.3s ease;

  .audio-bar {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .audio-meta {
    flex: 0 1 260px;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;

    .track-cover {
      width: 56px;
      height: 56px;
      flex: 0 0 56px;
      border-radius: 8px;
      object-fit: cover;
      background-color: rgba($dark-blue, 0.08);
    }

    .track-cover-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      color: rgba($dark-blue, 0.4);
    }

    .audio-info {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      line-height: 1.25;

      .station-name {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        color: $primary;

        .station-dot {
          width: 6px;
          height: 6px;
          flex: 0 0 6px;
          border-radius: 50%;
          background-color: $primary;
          box-shadow: 0 0 5px $primary;
        }
      }

      .track-title,
      .track-description {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .track-title { font-size: 1rem; }
      .track-description { font-size: 0.8rem; opacity: 0.75; }
    }
  }

  .audio-controls {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    flex: 0 0 auto;

    .btn-play {
      width: 48px;
      height: 48px;
      min-width: 48px;
      min-height: 48px;
      padding: 0;
      padding-left: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      border-radius: 50% !important;
      
      svg { display: block; }
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      min-width: 32px;
      min-height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      border-radius: 50% !important;
      svg { display: block; }
    }

    .btn-skip {
      width: 34px;
      height: 34px;
      min-width: 34px;
      min-height: 34px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      border-radius: 50% !important;
      svg { display: block; }
    }
  }

  .audio-progress-group {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1 1 auto;
    min-width: 120px;

    .time-elapsed, .time-total {
      font-size: 0.72rem;
      font-variant-numeric: tabular-nums;
      opacity: 0.7;
      min-width: 38px;
    }
    .time-elapsed { text-align: right; }
    .audio-progress { @include audio-range($light-blue); flex: 1 1 auto; min-width: 0; }
  }

  .audio-volume-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;

    .btn-mute {
      width: 28px;
      height: 28px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: transparent;
      border: 1px solid transparent;
      color: $body-color;
      opacity: 0.6;
      cursor: pointer;
      &:hover { opacity: 1; background: rgba($dark-blue, 0.08); }
    }

    .audio-volume { @include audio-range($strong-orange); flex: 0 0 90px; width: 90px; }
  }

  .btn-menu {
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: transparent;
    border: 1px solid transparent;
    color: $body-color;
    opacity: 0.6;
    transition: all 0.2s ease;
    cursor: pointer;
    
    &:hover {
      opacity: 1;
      background: rgba($dark-blue, 0.08);
      border-color: rgba($dark-blue, 0.1);
    }
  }
}

@media (max-width: 767.98px) {
  .audio-widget {
    left: 8px; right: 8px; bottom: 8px;
    padding: 8px 12px;

    .audio-bar { gap: 10px; }
    .station-name { display: none; }
    .js-back, .js-forward { display: none !important; }
    .audio-volume { display: none; }
    
    .audio-meta { flex: 1 1 auto; }
    .audio-meta .track-cover { width: 40px; height: 40px; flex-basis: 40px; }
    
    .audio-controls {
      .btn-play { width: 40px; height: 40px; min-width: 40px; min-height: 40px; }
      .btn-skip { width: 30px; height: 30px; min-width: 30px; min-height: 30px; }
    }
    
    .audio-progress-group { min-width: 80px; }
  }
}

@media (max-width: 419.98px) {
  .audio-widget {
    .time-total { display: none; }
    .time-elapsed { font-size: 0.65rem; }
  }
}
```

- [ ] **Step 4: Run tests and Verify**
Run: `npm run build && npm test`
Expected: PASS and build finishes without errors.

- [ ] **Step 5: Commit**
```bash
git add scss/_audio-widget.scss test/style.test.mjs css/
git commit -m "style: implement full-width bar layout"
```

### Task 4: Demo HTML wiring

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace demo markup and script wiring**
Modify `index.html` replacing `<audio-widget>` and its listener blocks:
```html
    <!-- Audio Widget Component -->
    <audio-widget 
        station="My Station" 
        track="Track Name" 
        artist="Artist"
        cover="https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&q=80&w=150&h=150">
    </audio-widget>

    <script src="js/audio-widget.js"></script>
    <script>
        const widget = document.querySelector('audio-widget');
        widget.duration = 2532; // 42:12
        let interval = null;
        
        widget.addEventListener('play', () => {
            console.log('Playing...');
            interval = setInterval(() => {
                if (widget.currentTime < widget.duration) {
                    widget.currentTime += 1;
                } else {
                    widget.isPlaying = false;
                    clearInterval(interval);
                }
            }, 1000);
        });
        
        widget.addEventListener('pause', () => {
            console.log('Paused.');
            clearInterval(interval);
        });
        
        widget.addEventListener('seek', (e) => {
            console.log('Seeked to', e.detail.time);
            widget.currentTime = e.detail.time;
        });

        widget.addEventListener('volumechange', (e) => console.log('Volume:', e.detail.volume));
        widget.addEventListener('mutechange', (e) => console.log('Muted:', e.detail.muted));
        widget.addEventListener('skipback', (e) => {
            console.log('Skip back', e.detail.seconds);
            widget.currentTime = Math.max(0, widget.currentTime - e.detail.seconds);
        });
        widget.addEventListener('skipforward', (e) => {
            console.log('Skip forward', e.detail.seconds);
            widget.currentTime = Math.min(widget.duration, widget.currentTime + e.detail.seconds);
        });
        widget.addEventListener('forward', () => console.log('Next track requested.'));
        widget.addEventListener('back', () => console.log('Previous track requested.'));
        widget.addEventListener('settings', () => console.log('Settings opened.'));
    </script>
```

Update paragraph describing the widget from:
`fixed to hover over the UI at the bottom right`
to:
`a full-width player bar docked to the bottom of the viewport`

- [ ] **Step 2: Commit**
```bash
git add index.html
git commit -m "docs: wire up demo page and update markup"
```
