# Station, Feed & Episode Card Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three visually distinct Bootstrap-theme card components — station, feed and episode — with a showcase and tests.

**Architecture:** One new SCSS partial (`scss/_cards.scss`) holds all three components, split into one block per card type. Each block is added in its own task with its own tests. The showcase lives in `index.html` and is verified by a markup-drift test.

**Tech Stack:** Dart Sass, Bootstrap 5, Bootstrap Icons (CDN in the showcase), Node's built-in test runner, jsdom, Puppeteer screenshot script.

**Spec:** `docs/superpowers/specs/2026-11-12-card-components-design.md`

## Global Constraints

- Styling only. No JavaScript, no web component, no behaviour.
- No new npm dependencies. Bootstrap Icons is loaded from the same CDN URL the app uses: `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css`.
- Use existing tokens from `scss/_variables.scss` only: `$dark-blue #001957`, `$light-blue #544ff4`, `$orange-light #ff9a00`, `$strong-orange #fc5d00` (also `$primary`), `$yellow #fdb200`, `$pale-violet #e9e8fd`, `$pale-yellow #fff4d8`. The two literal surface tints from the spec are `#f4f3ff` (feed) and `#fffaf0` (episode); the station gradient midpoint is `#12106b`.
- Exact class names, per the spec: `.card-station`, `.card-feed`, `.card-episode` plus the element/state classes listed in each task. Do not rename them.
- Card roots are `<div>`s. Navigation is an `<a class="stretched-link">` inside the title. Inner buttons keep `position: relative; z-index: 2`.
- Every card root is `position: relative` and gets `:focus-within` focus styling.
- Insert `@import "cards";` in `scss/theme.scss` directly after `@import "glass";`.
- Follow the existing file's style: 2-space indent, `//` comments, `&` nesting, colour functions (`rgba($token, .5)`).
- Tests use `node:test` + `node:assert/strict` and the existing helpers in `test/helpers/`.

## Review Focus

- **Long station/feed titles** must truncate with an ellipsis instead of wrapping and breaking the grid rhythm. Tests: `text-overflow: ellipsis` + `white-space: nowrap` in Task 1 and Task 2, episode clamp in Task 3.
- **A station with more than four covers** must stay a single row with equal widths, not overflow the card. Test: five covers, each `flex: 1 1 0`, in Task 1.
- **A feed with no cover** must not show a broken-image glyph; the app renders `.card-feed-cover-empty` and the theme gives it the violet gradient. Test: gradient declarations in Task 2.
- **A paused episode** must keep its progress bar. Test: progress display is driven by `.has-progress`, not `.is-playing`, in Task 3.
- **A played episode** must stay replayable: its button stays a `<button>` styled neutral. Test: `.is-played .card-episode-play` rules exist in Task 3.

---

### Task 1: Station card

**Files:**
- Create: `scss/_cards.scss`
- Modify: `scss/theme.scss`
- Create: `test/cards.test.mjs`

**Interfaces:**
- Produces: selectors `.card-station`, `.card-station-art`, `.card-station-cover`, `.card-station-cover-empty`, `.card-station-badge`, `.card-station-count`, `.card-station-body`, `.card-station-kicker`, `.card-station-title`, `.card-station-meta`, `.card-station-watermark`, `.card-station.is-empty`.
- Consumes from later tasks: none.

- [ ] **Step 1: Write the failing test**

Create `test/cards.test.mjs` with the shared helper and the station tests:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { compileTheme } from './helpers/styles.mjs';
import { createDom } from './helpers/dom.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export function cardWindow(html) {
    const dom = createDom();
    const style = dom.window.document.createElement('style');
    style.textContent = compileTheme();
    dom.window.document.head.appendChild(style);
    dom.window.document.body.innerHTML = html;
    return dom.window;
}

test('station card styles are compiled', () => {
    const css = compileTheme();
    for (const selector of [
        '.card-station',
        '.card-station-art',
        '.card-station-badge',
        '.card-station-count',
        '.card-station-title',
        '.card-station-cover-empty',
        '.card-station-watermark',
    ]) {
        assert.ok(css.includes(selector), selector);
    }
});

test('station covers stay in one equal-width row and long titles truncate', () => {
    const window = cardWindow(`
        <div class="card-station">
            <div class="card-station-art">
                <img class="card-station-cover"><img class="card-station-cover">
                <img class="card-station-cover"><img class="card-station-cover">
                <img class="card-station-cover">
            </div>
            <div class="card-station-body">
                <h3 class="card-station-title"><a class="stretched-link" href="#">A very long station name</a></h3>
            </div>
        </div>`);
    const doc = window.document;
    assert.equal(window.getComputedStyle(doc.querySelector('.card-station-art')).display, 'flex');
    const covers = [...doc.querySelectorAll('.card-station-cover')];
    assert.equal(covers.length, 5);
    covers.forEach((cover) => assert.equal(window.getComputedStyle(cover).flexGrow, '1'));
    const title = window.getComputedStyle(doc.querySelector('.card-station-title'));
    assert.equal(title.textOverflow, 'ellipsis');
    assert.equal(title.whiteSpace, 'nowrap');
});

test('station badge is a circular orange mark', () => {
    const window = cardWindow(`
        <div class="card-station"><div class="card-station-art">
            <span class="card-station-badge">B</span>
        </div></div>`);
    const style = window.getComputedStyle(window.document.querySelector('.card-station-badge'));
    assert.equal(style.borderRadius, '50%');
    assert.match(style.backgroundColor, /252,\s*93,\s*0/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/cards.test.mjs`
Expected: FAIL — `scss/_cards.scss` does not exist yet (Sass import error).

- [ ] **Step 3: Create `scss/_cards.scss` with the station block**

Open with a file comment: `// Station, feed and episode cards for the Ohrbob theme.` Then:

```scss
.card-station {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 15px;
  color: #fff;
  background: linear-gradient(135deg, $dark-blue 0%, #12106b 58%, $light-blue 135%);
  border: 1px solid rgba($orange-light, 0.45);
  box-shadow: 0 10px 30px rgba($dark-blue, 0.26);
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 15px;
    box-shadow: inset 0 0 24px rgba($strong-orange, 0.16);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 34px rgba($dark-blue, 0.32), 0 0 18px rgba($strong-orange, 0.18);
  }

  &:focus-within {
    outline: 2px solid rgba($light-blue, 0.6);
    outline-offset: 2px;
  }
}

.card-station-art {
  position: relative;
  display: flex;
  gap: 1px;
  height: 72px;
  overflow: hidden;
  background: rgba($dark-blue, 0.4);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba($dark-blue, 0.45) 0%, rgba($dark-blue, 0) 60%);
    pointer-events: none;
  }
}

.card-station-cover {
  flex: 1 1 0;
  min-width: 0;
  height: 72px;
  object-fit: cover;
  display: block;
  background: linear-gradient(135deg, $light-blue, $strong-orange);
}

.card-station-cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, $light-blue, $strong-orange);
}

.card-station-badge {
  position: absolute;
  left: 8px;
  top: 8px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: rgba($strong-orange, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  font-size: 12px;
  box-shadow: 0 0 16px rgba($strong-orange, 0.6);
}

.card-station-count {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 2;
  padding: 2px 7px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.4;
  color: #fff;
  background: rgba($dark-blue, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(6px);
}

.card-station-body {
  position: relative;
  padding: 9px 12px 12px;
}

.card-station-kicker {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: #ffb27a;
}

.card-station-title {
  margin: 2px 0 1px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  a {
    color: inherit;
    text-decoration: none;
  }
}

.card-station-meta {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.62);

  strong {
    color: #fff;
  }
}

.card-station-watermark {
  position: absolute;
  right: -8px;
  bottom: -14px;
  font-size: 64px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.05);
  pointer-events: none;
}

.card-station.is-empty .card-station-cover-empty {
  flex: 1 1 100%;
}
```

Add the import to `scss/theme.scss`:

```scss
@import "glass";
@import "cards";
@import "audio-widget";
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/cards.test.mjs`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add scss/_cards.scss scss/theme.scss test/cards.test.mjs
git commit -m "feat: add station card component"
```

---

### Task 2: Feed card

**Files:**
- Modify: `scss/_cards.scss`
- Modify: `test/cards.test.mjs`

**Interfaces:**
- Consumes: the compiled theme and `cardWindow()` from Task 1.
- Produces: `.card-feed`, `.card-feed-art`, `.card-feed-cover`, `.card-feed-cover-empty`, `.card-feed-badge`, `.card-feed-add`, `.card-feed-body`, `.card-feed-kicker`, `.card-feed-title`, `.card-feed-author`, `.card-feed-meta`.

- [ ] **Step 1: Write the failing tests**

Append to `test/cards.test.mjs`:

```js
test('feed card styles are compiled', () => {
    const css = compileTheme();
    for (const selector of [
        '.card-feed',
        '.card-feed-badge',
        '.card-feed-add',
        '.card-feed-cover-empty',
        '.card-feed-title',
    ]) {
        assert.ok(css.includes(selector), selector);
    }
    assert.match(css, /\.card-feed-cover\s*{[^}]*aspect-ratio:\s*1\s*\/\s*1/s);
});

test('feed titles truncate and the badge hangs off the cover', () => {
    const window = cardWindow(`
        <div class="card-feed">
            <div class="card-feed-art">
                <img class="card-feed-cover">
                <span class="card-feed-badge">R</span>
            </div>
            <div class="card-feed-body">
                <h3 class="card-feed-title"><a class="stretched-link" href="#">A very long podcast name</a></h3>
            </div>
        </div>`);
    const doc = window.document;
    const title = window.getComputedStyle(doc.querySelector('.card-feed-title'));
    assert.equal(title.textOverflow, 'ellipsis');
    assert.equal(title.whiteSpace, 'nowrap');
    const css = compileTheme();
    assert.match(css, /\.card-feed-badge\s*{[^}]*bottom:\s*-15px/s);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/cards.test.mjs`
Expected: FAIL — `.card-feed` selectors missing.

- [ ] **Step 3: Append the feed block to `scss/_cards.scss`**

```scss
.card-feed {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  border-radius: 15px;
  background: #f4f3ff;
  border: 1px solid rgba($light-blue, 0.28);
  box-shadow: 0 8px 22px rgba($light-blue, 0.12);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($light-blue, 0.5);
    box-shadow: 0 12px 28px rgba($light-blue, 0.2);
  }

  &:focus-within {
    outline: 2px solid rgba($light-blue, 0.55);
    outline-offset: 2px;
  }
}

.card-feed-art {
  position: relative;
}

.card-feed-cover {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: linear-gradient(135deg, $light-blue, $dark-blue);
}

.card-feed-cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, $light-blue, $dark-blue);
}

.card-feed-badge {
  position: absolute;
  left: 8px;
  bottom: -15px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: $light-blue;
  border: 2px solid #fff;
  color: #fff;
  font-size: 13px;
  box-shadow: 0 3px 10px rgba($dark-blue, 0.28);
}

.card-feed-add {
  position: absolute;
  right: 10px;
  top: 10px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: $strong-orange;
  color: #fff;
  font-size: 20px;
  box-shadow: 0 4px 14px rgba($strong-orange, 0.45);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 18px rgba($strong-orange, 0.55);
  }
}

.card-feed-body {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  padding: 19px 10px 11px;
}

.card-feed-kicker {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: $light-blue;
}

.card-feed-title {
  margin: 2px 0 1px;
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  a {
    color: inherit;
    text-decoration: none;
  }
}

.card-feed-author {
  margin: 0 0 4px;
  font-size: 10px;
  color: rgba($dark-blue, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-feed-meta {
  margin: 0;
  font-size: 9.5px;
  line-height: 1.35;
  color: rgba($dark-blue, 0.55);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/cards.test.mjs`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add scss/_cards.scss test/cards.test.mjs
git commit -m "feat: add feed card component"
```

---

### Task 3: Episode card

**Files:**
- Modify: `scss/_cards.scss`
- Modify: `test/cards.test.mjs`

**Interfaces:**
- Consumes: the compiled theme and `cardWindow()` from Task 1.
- Produces: `.card-episode`, `.card-episode-badge`, `.card-episode-body`, `.card-episode-kicker`, `.card-episode-title`, `.card-episode-meta`, `.card-episode-progress`, `.card-episode-play`, `.card-episode.is-playing`, `.card-episode.is-played`, `.card-episode.has-progress`.

- [ ] **Step 1: Write the failing tests**

Append to `test/cards.test.mjs`:

```js
test('episode card states are compiled', () => {
    const css = compileTheme();
    for (const selector of [
        '.card-episode',
        '.card-episode-badge',
        '.card-episode-play',
        '.card-episode.is-playing',
        '.card-episode.is-played',
        '.card-episode.has-progress .card-episode-progress',
    ]) {
        assert.ok(css.includes(selector), selector);
    }
    assert.match(css, /\.card-episode\s*{[^}]*border-left:\s*4px\s+solid/s);
});

test('episode rows are horizontal and paused progress stays visible', () => {
    const window = cardWindow(`
        <div class="card-episode"><span class="card-episode-badge">M</span>
            <div class="card-episode-body">
                <h3 class="card-episode-title"><a class="stretched-link" href="#">Episode</a></h3>
                <div class="card-episode-progress"><span style="width: 38%"></span></div>
            </div>
            <button class="card-episode-play">P</button>
        </div>
        <div class="card-episode has-progress"><div class="card-episode-body">
            <div class="card-episode-progress"><span style="width: 38%"></span></div>
        </div></div>`);
    const doc = window.document;
    const plain = doc.querySelectorAll('.card-episode')[0];
    assert.equal(window.getComputedStyle(plain).display, 'flex');
    assert.equal(window.getComputedStyle(plain.querySelector('.card-episode-progress')).display, 'none');
    const paused = doc.querySelectorAll('.card-episode')[1];
    assert.equal(window.getComputedStyle(paused.querySelector('.card-episode-progress')).display, 'block');
});

test('played episodes dim the title but keep a button', () => {
    const window = cardWindow(`
        <div class="card-episode is-played">
            <div class="card-episode-body">
                <h3 class="card-episode-title">Episode</h3>
            </div>
            <button class="card-episode-play">C</button>
        </div>`);
    const doc = window.document;
    const opacity = parseFloat(window.getComputedStyle(doc.querySelector('.card-episode-title')).opacity);
    assert.ok(opacity < 1, `expected dimmed title, got opacity ${opacity}`);
    const css = compileTheme();
    assert.match(css, /\.card-episode\.is-played\s+\.card-episode-play\s*{[^}]*background-color/s);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/cards.test.mjs`
Expected: FAIL — `.card-episode` selectors missing.

- [ ] **Step 3: Append the episode block to `scss/_cards.scss`**

```scss
.card-episode {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  overflow: hidden;
  padding: 11px 12px;
  border-radius: 13px;
  background-color: #fffaf0;
  border: 1px solid rgba($yellow, 0.42);
  border-left: 4px solid $strong-orange;
  box-shadow: 0 6px 18px rgba($yellow, 0.13);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;

  &:not(.is-played):hover {
    transform: translateY(-1px);
    box-shadow: 0 9px 24px rgba($yellow, 0.2);
  }

  &:focus-within {
    outline: 2px solid rgba($strong-orange, 0.45);
    outline-offset: 2px;
  }
}

.card-episode-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba($yellow, 0.18);
  color: #b57600;
  font-size: 14px;
}

.card-episode-body {
  flex: 1 1 auto;
  min-width: 0;
}

.card-episode-kicker {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: #c07a00;
}

.card-episode-title {
  margin: 2px 0;
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  a {
    color: inherit;
    text-decoration: none;
  }
}

.card-episode-meta {
  margin: 0;
  font-size: 9.5px;
  color: rgba($dark-blue, 0.55);
}

.card-episode-progress {
  display: none;
  height: 3px;
  margin-top: 7px;
  border-radius: 2px;
  background: rgba($dark-blue, 0.12);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, $strong-orange, $yellow);
  }
}

.card-episode.has-progress .card-episode-progress {
  display: block;
}

.card-episode-play {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: $strong-orange;
  color: #fff;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba($strong-orange, 0.45);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: scale(1.06);
    box-shadow: 0 6px 16px rgba($strong-orange, 0.55);
  }
}

.card-episode.is-playing {
  background-color: #fff6ea;
  box-shadow: 0 6px 20px rgba($strong-orange, 0.22);
}

.card-episode.is-played {
  background-color: #fbfbfd;
  border-color: rgba($dark-blue, 0.1);
  border-left-color: rgba($dark-blue, 0.18);
  box-shadow: none;
}

.card-episode.is-played .card-episode-badge {
  background-color: rgba($dark-blue, 0.07);
  color: rgba($dark-blue, 0.45);
}

.card-episode.is-played .card-episode-kicker {
  color: rgba($dark-blue, 0.4);
}

.card-episode.is-played .card-episode-title {
  opacity: 0.55;
}

.card-episode.is-played .card-episode-play {
  flex-basis: 32px;
  width: 32px;
  height: 32px;
  background-color: rgba($dark-blue, 0.08);
  color: rgba($dark-blue, 0.4);
  box-shadow: none;
  font-size: 14px;
}

@media (max-width: 767.98px) {
  .card-episode-title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    white-space: normal;
  }
}

@media (max-width: 575.98px) {
  .card-episode-kicker {
    display: none;
  }

  .card-episode-play {
    flex-basis: 32px;
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/cards.test.mjs`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add scss/_cards.scss test/cards.test.mjs
git commit -m "feat: add episode card component"
```

---

### Task 4: Showcase and build

**Files:**
- Modify: `index.html`
- Modify: `test/cards.test.mjs`
- Modify: `images/screenshot.png` (regenerated)

**Interfaces:**
- Consumes: all classes produced by Tasks 1–3.
- Produces: a "Card Components" showcase section that documents the markup, and a drift test.

- [ ] **Step 1: Write the failing drift test**

Append to `test/cards.test.mjs`:

```js
test('showcase documents all card components', () => {
    const html = readFileSync(path.join(root, 'index.html'), 'utf8');
    for (const marker of [
        'card-station',
        'card-feed',
        'card-episode',
        'is-playing',
        'is-played',
        'has-progress',
        'bootstrap-icons@1.11.3',
    ]) {
        assert.ok(html.includes(marker), marker);
    }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/cards.test.mjs`
Expected: FAIL — `bootstrap-icons@1.11.3` is not in `index.html`.

- [ ] **Step 3: Add the icon stylesheet and the showcase section**

In `index.html`, after the Prism `<link>`, add:

```html
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
```

Insert this section immediately before `<h2 class="mb-4">Components</h2>`:

```html
        <section class="mb-5">
            <h2 class="mb-4">Card Components</h2>
            <p>Three cards for the three content levels. A <strong>station</strong> collects feeds and is the dark anchor; a <strong>feed</strong> is one podcast show in violet glass; an <strong>episode</strong> is one listenable row in warm paper.</p>

            <h5 class="mt-4">Station</h5>
            <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-3">
                <div class="col">
                    <div class="card-station h-100">
                        <div class="card-station-art">
                            <img class="card-station-cover" src="https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&q=80&w=300&h=300" alt="">
                            <img class="card-station-cover" src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=300&h=300" alt="">
                            <img class="card-station-cover" src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=300&h=300" alt="">
                            <img class="card-station-cover" src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300&h=300" alt="">
                            <span class="card-station-badge" aria-hidden="true"><i class="bi bi-broadcast"></i></span>
                            <span class="card-station-count">4 podcasts</span>
                        </div>
                        <div class="card-station-body">
                            <i class="bi bi-soundwave card-station-watermark" aria-hidden="true"></i>
                            <div class="card-station-kicker"><i class="bi bi-broadcast" aria-hidden="true"></i> Station</div>
                            <h3 class="card-station-title"><a class="stretched-link" href="#">Laberpodcasts</a></h3>
                            <p class="card-station-meta"><strong>411</strong> episodes · Kai</p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card-station h-100">
                        <div class="card-station-art">
                            <img class="card-station-cover" src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=300&h=300" alt="">
                            <span class="card-station-badge" aria-hidden="true"><i class="bi bi-broadcast"></i></span>
                            <span class="card-station-count">1 podcast</span>
                        </div>
                        <div class="card-station-body">
                            <i class="bi bi-soundwave card-station-watermark" aria-hidden="true"></i>
                            <div class="card-station-kicker"><i class="bi bi-broadcast" aria-hidden="true"></i> Station</div>
                            <h3 class="card-station-title"><a class="stretched-link" href="#">Kopfkino</a></h3>
                            <p class="card-station-meta"><strong>42</strong> episodes · Jo</p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card-station is-empty h-100">
                        <div class="card-station-art">
                            <div class="card-station-cover card-station-cover-empty" aria-hidden="true">N</div>
                            <span class="card-station-badge" aria-hidden="true"><i class="bi bi-broadcast"></i></span>
                            <span class="card-station-count">0 podcasts</span>
                        </div>
                        <div class="card-station-body">
                            <i class="bi bi-soundwave card-station-watermark" aria-hidden="true"></i>
                            <div class="card-station-kicker"><i class="bi bi-broadcast" aria-hidden="true"></i> Station</div>
                            <h3 class="card-station-title"><a class="stretched-link" href="#">Nachtcafé</a></h3>
                            <p class="card-station-meta"><strong>0</strong> episodes · Anna</p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card-station h-100">
                        <div class="card-station-art">
                            <img class="card-station-cover" src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=300&h=300" alt="">
                            <img class="card-station-cover" src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300&h=300" alt="">
                            <img class="card-station-cover" src="https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&q=80&w=300&h=300" alt="">
                            <span class="card-station-badge" aria-hidden="true"><i class="bi bi-broadcast"></i></span>
                            <span class="card-station-count">3 podcasts</span>
                        </div>
                        <div class="card-station-body">
                            <i class="bi bi-soundwave card-station-watermark" aria-hidden="true"></i>
                            <div class="card-station-kicker"><i class="bi bi-broadcast" aria-hidden="true"></i> Station</div>
                            <h3 class="card-station-title"><a class="stretched-link" href="#">Sonntagsbrunch</a></h3>
                            <p class="card-station-meta"><strong>512</strong> episodes · Mia</p>
                        </div>
                    </div>
                </div>
            </div>
<pre class="mb-4"><code class="language-html">&lt;div class="card-station"&gt;
  &lt;div class="card-station-art"&gt;
    &lt;img class="card-station-cover" src="cover.jpg" alt=""&gt;
    &lt;span class="card-station-badge"&gt;&lt;i class="bi bi-broadcast"&gt;&lt;/i&gt;&lt;/span&gt;
    &lt;span class="card-station-count"&gt;4 podcasts&lt;/span&gt;
  &lt;/div&gt;
  &lt;div class="card-station-body"&gt;
    &lt;div class="card-station-kicker"&gt;Station&lt;/div&gt;
    &lt;h3 class="card-station-title"&gt;&lt;a class="stretched-link" href="#"&gt;Laberpodcasts&lt;/a&gt;&lt;/h3&gt;
    &lt;p class="card-station-meta"&gt;&lt;strong&gt;411&lt;/strong&gt; episodes&lt;/p&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>

            <h5 class="mt-4">Feed</h5>
            <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3 mb-3">
                <div class="col">
                    <div class="card-feed h-100">
                        <div class="card-feed-art">
                            <img class="card-feed-cover" src="https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&q=80&w=400&h=400" alt="">
                            <span class="card-feed-badge" aria-hidden="true"><i class="bi bi-rss"></i></span>
                            <button class="card-feed-add" type="button" aria-label="Add to a station"><i class="bi bi-plus-lg" aria-hidden="true"></i></button>
                        </div>
                        <div class="card-feed-body">
                            <div class="card-feed-kicker"><i class="bi bi-rss" aria-hidden="true"></i> Feed</div>
                            <h3 class="card-feed-title"><a class="stretched-link" href="#">Kalk &amp; Welk</a></h3>
                            <p class="card-feed-author">Die fabelhaften Boomer Boys</p>
                            <p class="card-feed-meta">104 episodes · Updated 12 Nov</p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card-feed h-100">
                        <div class="card-feed-art">
                            <img class="card-feed-cover" src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=400&h=400" alt="">
                            <span class="card-feed-badge" aria-hidden="true"><i class="bi bi-rss"></i></span>
                        </div>
                        <div class="card-feed-body">
                            <div class="card-feed-kicker"><i class="bi bi-rss" aria-hidden="true"></i> Feed</div>
                            <h3 class="card-feed-title"><a class="stretched-link" href="#">Talk ohne Gast</a></h3>
                            <p class="card-feed-author">Zeit Online</p>
                            <p class="card-feed-meta">307 episodes · Updated 11 Nov</p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card-feed h-100">
                        <div class="card-feed-art">
                            <div class="card-feed-cover card-feed-cover-empty" aria-hidden="true">L</div>
                            <span class="card-feed-badge" aria-hidden="true"><i class="bi bi-rss"></i></span>
                        </div>
                        <div class="card-feed-body">
                            <div class="card-feed-kicker"><i class="bi bi-rss" aria-hidden="true"></i> Feed</div>
                            <h3 class="card-feed-title"><a class="stretched-link" href="#">Lanz &amp; Precht</a></h3>
                            <p class="card-feed-author">ZDF</p>
                            <p class="card-feed-meta">72 episodes · Updated 10 Nov</p>
                        </div>
                    </div>
                </div>
            </div>
<pre class="mb-4"><code class="language-html">&lt;div class="card-feed"&gt;
  &lt;div class="card-feed-art"&gt;
    &lt;img class="card-feed-cover" src="cover.jpg" alt=""&gt;
    &lt;span class="card-feed-badge"&gt;&lt;i class="bi bi-rss"&gt;&lt;/i&gt;&lt;/span&gt;
  &lt;/div&gt;
  &lt;div class="card-feed-body"&gt;
    &lt;div class="card-feed-kicker"&gt;Feed&lt;/div&gt;
    &lt;h3 class="card-feed-title"&gt;&lt;a class="stretched-link" href="#"&gt;Kalk &amp;amp; Welk&lt;/a&gt;&lt;/h3&gt;
    &lt;p class="card-feed-author"&gt;Die fabelhaften Boomer Boys&lt;/p&gt;
    &lt;p class="card-feed-meta"&gt;104 episodes · Updated 12 Nov&lt;/p&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>

            <h5 class="mt-4">Episode</h5>
            <div class="d-flex flex-column gap-2 mb-3">
                <div class="card-episode">
                    <span class="card-episode-badge" aria-hidden="true"><i class="bi bi-mic"></i></span>
                    <div class="card-episode-body">
                        <div class="card-episode-kicker"><i class="bi bi-mic" aria-hidden="true"></i> Episode</div>
                        <h3 class="card-episode-title"><a class="stretched-link" href="#">Folge 103: Der Diskurs ist kaputt</a></h3>
                        <p class="card-episode-meta">Kalk &amp; Welk · 5 Nov · 58 min</p>
                    </div>
                    <button class="card-episode-play" type="button" aria-label="Play episode"><i class="bi bi-play-fill" aria-hidden="true"></i></button>
                </div>
                <div class="card-episode is-playing has-progress">
                    <span class="card-episode-badge" aria-hidden="true"><i class="bi bi-mic"></i></span>
                    <div class="card-episode-body">
                        <div class="card-episode-kicker"><i class="bi bi-mic" aria-hidden="true"></i> Episode · playing</div>
                        <h3 class="card-episode-title"><a class="stretched-link" href="#">Folge 104: Warum wir immer noch über Boomer reden</a></h3>
                        <p class="card-episode-meta">Kalk &amp; Welk · 12 Nov · 22 min left</p>
                        <div class="card-episode-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="38"><span style="width: 38%"></span></div>
                    </div>
                    <button class="card-episode-play" type="button" aria-label="Pause episode"><i class="bi bi-pause-fill" aria-hidden="true"></i></button>
                </div>
                <div class="card-episode is-played">
                    <span class="card-episode-badge" aria-hidden="true"><i class="bi bi-mic"></i></span>
                    <div class="card-episode-body">
                        <div class="card-episode-kicker"><i class="bi bi-mic" aria-hidden="true"></i> Episode · played</div>
                        <h3 class="card-episode-title"><a class="stretched-link" href="#">Folge 102: Was war nochmal normal?</a></h3>
                        <p class="card-episode-meta">Kalk &amp; Welk · 29 Oct · 61 min</p>
                    </div>
                    <button class="card-episode-play" type="button" aria-label="Play again"><i class="bi bi-check-lg" aria-hidden="true"></i></button>
                </div>
            </div>
<pre class="mb-4"><code class="language-html">&lt;div class="card-episode is-playing has-progress"&gt;
  &lt;span class="card-episode-badge"&gt;&lt;i class="bi bi-mic"&gt;&lt;/i&gt;&lt;/span&gt;
  &lt;div class="card-episode-body"&gt;
    &lt;div class="card-episode-kicker"&gt;Episode&lt;/div&gt;
    &lt;h3 class="card-episode-title"&gt;&lt;a class="stretched-link" href="#"&gt;Folge 104&lt;/a&gt;&lt;/h3&gt;
    &lt;p class="card-episode-meta"&gt;Kalk &amp;amp; Welk · 12 Nov · 22 min left&lt;/p&gt;
    &lt;div class="card-episode-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="38"&gt;&lt;span style="width: 38%"&gt;&lt;/span&gt;&lt;/div&gt;
  &lt;/div&gt;
  &lt;button class="card-episode-play" type="button" aria-label="Pause episode"&gt;&lt;i class="bi bi-pause-fill"&gt;&lt;/i&gt;&lt;/button&gt;
&lt;/div&gt;</code></pre>
        </section>
```

Fix the snippet's `&lt;div` escapes so the code sample renders correctly — every `<` in the sample must be `&lt;`, including the opening `card-feed` div.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all suites, including the new 9 card tests.

- [ ] **Step 5: Build and inspect the screenshot**

Run: `npm run build`
Expected: `css/theme.css` recompiles and `images/screenshot.png` is regenerated. Open the screenshot and confirm the three card types are visibly different and the Bootstrap Icons badges are not blank. If icons are blank, the CDN was unreachable — report it rather than committing a blank screenshot.

- [ ] **Step 6: Commit**

```bash
git add index.html test/cards.test.mjs css/theme.css images/screenshot.png
git commit -m "docs: add card component showcase"
```
