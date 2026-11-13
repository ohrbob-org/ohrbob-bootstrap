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
    assert.match(css, /\.card-episode\s*{[^}]*border:\s*1px\s+solid/s);
    assert.match(css, /\.card-episode::before\s*{[^}]*border-radius:\s*4px/s);
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
    assert.equal(window.getComputedStyle(plain).borderLeftWidth, '1px');
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

test('stretched links resolve against the card and overlays pass clicks through', () => {
    const window = cardWindow(`
        <div class="card-station">
            <span class="card-station-badge">B</span>
            <span class="card-station-count">2 podcasts</span>
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
    for (const selector of ['.card-station-badge', '.card-station-count', '.card-feed-badge']) {
        assert.equal(window.getComputedStyle(doc.querySelector(selector)).pointerEvents, 'none', selector);
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
    assert.ok(fontSize('.card-station-title') >= 17, 'station title');
    assert.ok(fontSize('.card-feed-title') >= 15.5, 'feed title');
    assert.ok(fontSize('.card-episode-title') >= 13.5, 'episode title');
    const play = window.getComputedStyle(doc.querySelector('.card-episode-play'));
    assert.equal(play.width, '40px');
    assert.equal(play.height, '40px');
});

test('episode tab colour is driven by a CSS custom property', () => {
    const window = cardWindow(`
        <div class="card-episode"><button class="card-episode-play">P</button></div>
        <div class="card-episode" style="--card-episode-accent: #E63946">
            <button class="card-episode-play">P</button>
        </div>`);
    const doc = window.document;
    const cards = [...doc.querySelectorAll('.card-episode')];
    assert.equal(
        window.getComputedStyle(cards[0]).getPropertyValue('--card-episode-accent').trim(),
        '#fc5d00'
    );
    assert.equal(
        window.getComputedStyle(cards[1]).getPropertyValue('--card-episode-accent').trim(),
        '#E63946'
    );
    const css = compileTheme();
    assert.match(css, /\.card-episode::before\s*{[^}]*var\(--card-episode-accent\)/s);
});

test('station cards drop the kicker and give its space to the title', () => {
    const css = compileTheme();
    assert.ok(!css.includes('.card-station-kicker'), 'kicker rule removed');
    const html = readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.ok(!html.includes('card-station-kicker'), 'showcase has no station kicker');
});

test('feed cards drop the kicker and enlarge their body text', () => {
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
    assert.ok(fontSize('.card-feed-author') >= 12, 'feed author');
    assert.ok(fontSize('.card-feed-meta') >= 11.5, 'feed meta');
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

test('station editor rows share the station card surface', () => {
    const css = compileTheme();
    assert.match(css, /\.card-station-feed\s*{[^}]*#12106b/s);
    assert.match(css, /\.card-station-feed-title\s*{[^}]*color:\s*#fff/s);

    const window = cardWindow(`
        <div class="card-station-feed"><div class="card-station-feed-body">
            <strong class="card-station-feed-title">Title</strong>
        </div></div>`);
    const title = window.getComputedStyle(window.document.querySelector('.card-station-feed-title'));
    assert.equal(title.color, 'rgb(255, 255, 255)');
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
