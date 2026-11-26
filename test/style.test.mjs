import test from 'node:test';
import assert from 'node:assert/strict';
import { createStyledDom, compileTheme } from './helpers/styles.mjs';

test('audio widget is a flat deck pinned to the bottom', () => {
    const { el, window } = createStyledDom();
    const style = window.getComputedStyle(el);
    assert.equal(style.position, 'fixed');
    assert.equal(style.left, '0px');
    assert.equal(style.bottom, '0px');
    assert.equal(style.borderRadius, '0px');

    const bar = window.getComputedStyle(el.querySelector('.audio-bar'));
    assert.equal(bar.display, 'grid');
    assert.match(bar.gridTemplateAreas, /progress/);
    assert.match(bar.gridTemplateAreas, /controls/);
});

test('media queries exist in compiled CSS', () => {
    const css = compileTheme();
    assert.ok(css.includes('@media (max-width: 767.98px)'));
    assert.ok(css.includes('@media (max-width: 419.98px)'));
});

test('Metro panels are flat instead of frosted glass', () => {
    const { window, document } = createStyledDom();
    const panel = document.createElement('div');
    panel.className = 'glass-panel';
    document.body.appendChild(panel);

    const css = compileTheme();
    assert.match(css, /\.glass-panel[^{]*{[^}]*backdrop-filter:\s*none/s);
    assert.match(css, /\.glass-panel[^{]*{[^}]*border-radius:\s*0/s);
    assert.equal(window.getComputedStyle(panel).borderRadius, '0px');
    assert.equal(window.getComputedStyle(panel).boxShadow, 'none');
});

test('audio widget play button is the oversized orange deck button', () => {
    const { el, window } = createStyledDom();
    const play = el.querySelector('.js-play');
    assert.equal(window.getComputedStyle(play).width, '72px');
    assert.equal(window.getComputedStyle(play).height, '72px');
    assert.equal(window.getComputedStyle(play).borderRadius, '0px');
    assert.equal(window.getComputedStyle(el.querySelector('.audio-controls')).gap, '12px');
});

test('audio widget progress and volume thumbs have rounded borders', () => {
    const css = compileTheme();
    assert.match(css, /::-webkit-slider-thumb[^}]*border-radius:\s*4px/s);
    assert.match(css, /::-moz-range-thumb[^}]*border-radius:\s*4px/s);
});

test('Metro typography and theme tokens are compiled', () => {
    const css = compileTheme();
    for (const token of [
        '--metro-canvas',
        '--metro-ink',
        '--metro-hairline',
        '--metro-orange',
        '@font-face',
        'Sulphur Point',
    ]) {
        assert.ok(css.includes(token), token);
    }
    assert.match(css, /--metro-canvas:\s*#f4f1ea/i);
    assert.match(css, /--metro-ink:\s*#111217/i);
});
