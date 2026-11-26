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

test('Metro tokens and card styles are compiled', () => {
    const css = compileTheme();
    for (const selector of [
        '--metro-canvas',
        '--metro-ink',
        '--metro-hairline',
        '.card-station',
        '.card-station-art',
        '.card-station-title',
        '.card-station-cover-empty',
        '.card-feed',
        '.card-feed-cover',
        '.card-feed-title',
        '.card-episode',
        '.card-episode-cover',
        '.card-episode-play',
    ]) {
        assert.ok(css.includes(selector), selector);
    }
    assert.match(css, /\.card-station\s*{[^}]*border-radius:\s*0/s);
    assert.match(css, /\.card-episode\s*{[^}]*display:\s*grid/s);
});

test('station covers form a 2x2 mosaic and long titles truncate', () => {
    const window = cardWindow(`
        <div class="card-station">
            <div class="card-station-art">
                <img class="card-station-cover"><img class="card-station-cover">
                <img class="card-station-cover"><img class="card-station-cover">
            </div>
            <div class="card-station-body">
                <h3 class="card-station-title"><a class="stretched-link" href="#">A very long station name</a></h3>
            </div>
        </div>`);
    const doc = window.document;
    const art = window.getComputedStyle(doc.querySelector('.card-station-art'));
    assert.equal(art.display, 'grid');
    assert.match(art.gridTemplateColumns, /repeat\(2/);
    const covers = [...doc.querySelectorAll('.card-station-cover')];
    assert.equal(covers.length, 4);
    covers.forEach((cover) => assert.equal(window.getComputedStyle(cover).objectFit, 'cover'));
    const title = window.getComputedStyle(doc.querySelector('.card-station-title'));
    assert.equal(title.textOverflow, 'ellipsis');
    assert.equal(title.whiteSpace, 'nowrap');
    assert.equal(title.fontSize, '27px');
});

test('Metro station tiles hide the legacy badge, count and watermark', () => {
    const window = cardWindow(`
        <div class="card-station">
            <div class="card-station-art"><span class="card-station-badge">B</span></div>
            <span class="card-station-count">2 podcasts</span>
            <span class="card-station-watermark">W</span>
            <div class="card-station-body"><h3 class="card-station-title">Station</h3></div>
        </div>`);
    const doc = window.document;
    for (const selector of ['.card-station-badge', '.card-station-count', '.card-station-watermark']) {
        assert.equal(window.getComputedStyle(doc.querySelector(selector)).display, 'none', selector);
    }
});

test('feed card styles are compiled and titles truncate', () => {
    const window = cardWindow(`
        <div class="card-feed">
            <div class="card-feed-art">
                <img class="card-feed-cover">
                <button class="card-feed-add">+</button>
            </div>
            <div class="card-feed-body">
                <h3 class="card-feed-title"><a class="stretched-link" href="#">A very long podcast name</a></h3>
            </div>
        </div>`);
    const doc = window.document;
    const title = window.getComputedStyle(doc.querySelector('.card-feed-title'));
    assert.equal(title.textOverflow, 'ellipsis');
    assert.equal(title.whiteSpace, 'nowrap');
    assert.equal(window.getComputedStyle(doc.querySelector('.card-feed-cover')).objectFit, 'cover');
    assert.equal(window.getComputedStyle(doc.querySelector('.card-feed-add')).borderRadius, '0px');
    assert.equal(window.getComputedStyle(doc.querySelector('.card-feed-badge') || doc.querySelector('.card-feed-add')).pointerEvents !== 'none', true);
});

test('episode rows are flat and the current row gets the orange tab', () => {
    const window = cardWindow(`
        <div class="card-episode is-playing">
            <span class="card-episode-badge">M</span>
            <div class="card-episode-body">
                <h3 class="card-episode-title"><a class="stretched-link" href="#">Episode</a></h3>
                <div class="card-episode-progress"><span style="width: 38%"></span></div>
            </div>
            <button class="card-episode-play">P</button>
        </div>
        <div class="card-episode has-progress">
            <div class="card-episode-body">
                <div class="card-episode-progress"><span style="width: 38%"></span></div>
            </div>
        </div>`);
    const doc = window.document;
    const plain = doc.querySelectorAll('.card-episode')[0];
    const style = window.getComputedStyle(plain);
    assert.equal(style.display, 'grid');
    assert.equal(style.borderLeftWidth, '0px');
    assert.match(style.gridTemplateColumns, /58px/);
    assert.equal(style.borderRadius, '0px');
    assert.equal(window.getComputedStyle(plain.querySelector('.card-episode-progress')).display, 'none');
    const paused = doc.querySelectorAll('.card-episode')[1];
    assert.equal(window.getComputedStyle(paused.querySelector('.card-episode-progress')).display, 'block');
});

test('current episode tab is orange and the custom property is overridable', () => {
    const window = cardWindow(`
        <div class="card-episode is-playing"></div>
        <div class="card-episode" style="--card-episode-accent: #E63946"></div>`);
    const doc = window.document;
    const cards = [...doc.querySelectorAll('.card-episode')];
    assert.equal(window.getComputedStyle(cards[0]).getPropertyValue('--card-episode-accent').trim(), '#fc5d00');
    assert.equal(window.getComputedStyle(cards[1]).getPropertyValue('--card-episode-accent').trim(), '#E63946');
    const css = compileTheme();
    assert.match(css, /\.card-episode\.is-playing::before\s*{[^}]*var\(--card-episode-accent\)/s);
});

test('completed episodes dim and strike the title', () => {
    const window = cardWindow(`
        <div class="card-episode is-played">
            <div class="card-episode-body">
                <h3 class="card-episode-title">Episode</h3>
            </div>
            <button class="card-episode-play">C</button>
        </div>`);
    const doc = window.document;
    const row = doc.querySelector('.card-episode');
    const title = doc.querySelector('.card-episode-title');
    assert.ok(parseFloat(window.getComputedStyle(row).opacity) < 1);
    assert.match(window.getComputedStyle(title).textDecoration, /line-through/);
    const css = compileTheme();
    assert.match(css, /\.card-episode\.is-played\s+\.card-episode-play\s*{[^}]*background/s);
});

test('showcase documents all card components and the Metro preview', () => {
    const html = readFileSync(path.join(root, 'index.html'), 'utf8');
    for (const marker of [
        'card-station',
        'card-feed',
        'card-episode',
        'is-playing',
        'is-played',
        'has-progress',
        'bootstrap-icons@1.11.3',
        'now-playing',
        'playlist-pane',
        'connect-page',
        'themeToggle',
    ]) {
        assert.ok(html.includes(marker), marker);
    }
});

test('stretched links resolve against the card and decorative overlays pass clicks through', () => {
    const window = cardWindow(`
        <div class="card-station">
            <span class="card-station-badge">B</span>
            <div class="card-station-body">
                <h3 class="card-station-title"><a class="stretched-link" href="#">Station</a></h3>
            </div>
        </div>
        <div class="card-feed">
            <span class="card-feed-badge">R</span>
            <div class="card-feed-body">
                <h3 class="card-feed-title"><a class="stretched-link" href="#">Feed</a></h3>
            </div>
        </div>`);
    const doc = window.document;
    for (const selector of ['.card-station-body', '.card-feed-body']) {
        assert.equal(window.getComputedStyle(doc.querySelector(selector)).position, 'static', selector);
    }
    for (const selector of ['.card-station-badge', '.card-feed-badge']) {
        assert.equal(window.getComputedStyle(doc.querySelector(selector)).display, 'none', selector);
    }
});

test('card type scale and play button are comfortably sized', () => {
    const window = cardWindow(`
        <div class="card-station"><div class="card-station-body">
            <h3 class="card-station-title">Station</h3>
        </div></div>
        <div class="card-feed"><div class="card-feed-body">
            <h3 class="card-feed-title">Feed</h3>
        </div></div>
        <div class="card-episode">
            <div class="card-episode-body">
                <h3 class="card-episode-title">Episode</h3>
            </div>
            <button class="card-episode-play">P</button>
        </div>`);
    const doc = window.document;
    const fontSize = (selector) => parseFloat(window.getComputedStyle(doc.querySelector(selector)).fontSize);
    assert.ok(fontSize('.card-station-title') >= 27, 'station title');
    assert.ok(fontSize('.card-feed-title') >= 18, 'feed title');
    assert.ok(fontSize('.card-episode-title') >= 15, 'episode title');
    const play = window.getComputedStyle(doc.querySelector('.card-episode-play'));
    assert.equal(play.width, '40px');
    assert.equal(play.height, '40px');
    assert.equal(play.borderRadius, '0px');
});

test('station cards drop the kicker and give its space to the title', () => {
    const css = compileTheme();
    assert.ok(!css.includes('.card-station-kicker'), 'kicker rule removed');
    const html = readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.ok(!html.includes('card-station-kicker'), 'showcase has no station kicker');
});

test('feed cards drop the kicker and use the Metro body scale', () => {
    const css = compileTheme();
    assert.ok(!css.includes('.card-feed-kicker'), 'kicker rule removed');
    const html = readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.ok(!html.includes('card-feed-kicker'), 'showcase has no feed kicker');

    const window = cardWindow(`
        <div class="card-feed"><div class="card-feed-body">
            <h3 class="card-feed-title">Feed</h3>
            <p class="card-feed-author">Author</p>
            <p class="card-feed-meta">12 episodes</p>
        </div></div>`);
    const doc = window.document;
    const fontSize = (selector) => parseFloat(window.getComputedStyle(doc.querySelector(selector)).fontSize);
    assert.ok(fontSize('.card-feed-author') >= 11, 'feed author');
    assert.ok(fontSize('.card-feed-meta') >= 10, 'feed meta');
});

test('rotation control is a pill with a circular sliding thumb', () => {
    const window = cardWindow(`
        <div class="playback-order-toggle" aria-valuenow="1">
            <span class="slider-thumb-container"></span>
            <button class="playback-node-btn"></button>
            <button class="playback-node-btn"></button>
            <button class="playback-node-btn"></button>
        </div>`);
    const doc = window.document;
    const track = window.getComputedStyle(doc.querySelector('.playback-order-toggle'));
    const thumb = window.getComputedStyle(doc.querySelector('.slider-thumb-container'));
    assert.equal(track.borderRadius, '999px');
    assert.equal(thumb.borderRadius, '50%');
    assert.equal(doc.querySelectorAll('.playback-node-btn').length, 3);
});

test('profile avatar does not render a dropdown caret', () => {
    const html = readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.doesNotMatch(html, /class="profile-avatar[^"]*dropdown-toggle/);
    assert.match(html, /class="profile-avatar"[^>]*data-bs-toggle="dropdown"/);
});

test('station editor row styles and hooks are compiled', () => {
    const css = compileTheme();
    for (const selector of [
        '.card-station-feed',
        '.card-station-feed-cover',
        '.card-station-feed-body',
        '.card-station-feed-title',
        '.card-station-feed-meta',
        '.playback-order-toggle',
        '.slider-thumb-container',
        '.card-station-feed-span',
        '.card-station-feed-menu',
    ]) {
        assert.ok(css.includes(selector), selector);
    }
    assert.match(css, /\[aria-valuenow="2"\]\s+\.slider-thumb-container/s);
    assert.match(css, /var\(--station-feed-accent\)/);
});

test('station editor row lays out a cover and accepts a feed accent', () => {
    const window = cardWindow(`
        <div class="card-station-feed rotation-item" style="--station-feed-accent: #E63946">
            <img class="card-station-feed-cover" alt="">
            <div class="card-station-feed-body">
                <div class="playback-order-toggle-container"></div>
            </div>
        </div>`);
    const doc = window.document;
    const card = doc.querySelector('.card-station-feed');
    assert.equal(window.getComputedStyle(card).display, 'flex');
    assert.equal(window.getComputedStyle(card).getPropertyValue('--station-feed-accent').trim(), '#E63946');
    const cover = window.getComputedStyle(doc.querySelector('.card-station-feed-cover'));
    assert.equal(cover.width, '96px');
    assert.equal(cover.height, '96px');
    assert.equal(cover.objectFit, 'cover');
    const toggle = window.getComputedStyle(doc.querySelector('.playback-order-toggle-container'));
    assert.equal(toggle.width, '104px');
    assert.equal(toggle.flexShrink, '0');
});

test('station editor rows use the flat Metro surface', () => {
    const css = compileTheme();
    assert.match(css, /\.card-station-feed\s*{[^}]*background:\s*var\(--metro-tile\)/s);
    assert.match(css, /\.card-station-feed-title\s*{[^}]*color:\s*var\(--metro-ink\)/s);

    const window = cardWindow(`
        <div class="card-station-feed"><div class="card-station-feed-body">
            <strong class="card-station-feed-title">Title</strong>
        </div></div>`);
    const title = window.getComputedStyle(window.document.querySelector('.card-station-feed-title'));
    assert.equal(title.color, 'var(--metro-ink)');
});

test('station editor row showcase keeps the product hooks', () => {
    const html = readFileSync(path.join(root, 'index.html'), 'utf8');
    for (const marker of [
        'card-station-feed',
        'rotation-item',
        'playback-order-toggle',
        'playback-order-value',
        'episodes-input',
        'move-feed',
        'remove-feed',
    ]) {
        assert.ok(html.includes(marker), marker);
    }
});

test('station editor rows are square and carry the watermark hook', () => {
    const window = cardWindow(`
        <div class="list-group">
            <div class="list-group-item card-station-feed"></div>
            <div class="list-group-item card-station-feed"></div>
        </div>`);
    const rows = [...window.document.querySelectorAll('.card-station-feed')];
    rows.forEach((row) => assert.equal(window.getComputedStyle(row).borderRadius, '0px'));

    const css = compileTheme();
    assert.match(css, /\.list-group-item\.card-station-feed\s*{[^}]*border-radius:\s*0/s);
    assert.ok(css.includes('.card-station-feed-watermark'));
    const html = readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.ok(html.includes('card-station-feed-watermark'));
});
