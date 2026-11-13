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

test('glass surfaces have a frost strong enough for image backgrounds', () => {
    const { window, document } = createStyledDom();
    const alpha = (element) => {
        const parts = window.getComputedStyle(element).backgroundColor.match(/[\d.]+/g) || [];
        return parts.length === 4 ? parseFloat(parts[3]) : 1;
    };
    const panel = document.createElement('div');
    panel.className = 'glass-panel';
    document.body.appendChild(panel);
    const input = document.createElement('input');
    input.className = 'glass-input';
    document.body.appendChild(input);

    assert.ok(alpha(panel) >= 0.5, `panel alpha ${alpha(panel)}`);
    assert.ok(alpha(input) >= 0.5, `input alpha ${alpha(input)}`);
});

test('audio widget play button is large and the controls sit tight', () => {
    const { window, el } = createStyledDom();
    const play = el.querySelector('.js-play');
    assert.equal(window.getComputedStyle(play).width, '56px');
    assert.equal(window.getComputedStyle(play).height, '56px');
    assert.equal(window.getComputedStyle(el.querySelector('.audio-controls')).gap, '4px');
});