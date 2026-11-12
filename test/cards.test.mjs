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
