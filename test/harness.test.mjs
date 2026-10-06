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