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