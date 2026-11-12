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
