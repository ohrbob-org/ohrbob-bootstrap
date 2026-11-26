import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createDom } from './helpers/dom.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = readFileSync(path.join(root, 'js', 'rotation-control.js'), 'utf8');

function rotationWindow(value = '1') {
    const dom = createDom();
    const doc = dom.window.document;
    doc.body.innerHTML = `
        <span class="playback-order-toggle-container">
            <div class="playback-order-toggle" role="slider" aria-valuemin="0" aria-valuemax="2" aria-valuenow="${value}">
                <span class="slider-thumb-container"><i class="bi bi-sort-down"></i></span>
                <button class="playback-node-btn" type="button"><i></i></button>
                <button class="playback-node-btn" type="button"><i></i></button>
                <button class="playback-node-btn" type="button"><i></i></button>
            </div>
            <input class="playback-order-value" type="hidden" value="${value}">
        </span>`;

    const track = doc.querySelector('.playback-order-toggle');
    const thumb = doc.querySelector('.slider-thumb-container');
    track.getBoundingClientRect = () => ({ left: 0, top: 0, right: 84, bottom: 26, width: 84, height: 26 });
    thumb.getBoundingClientRect = () => ({ left: 0, top: 0, right: 20, bottom: 20, width: 20, height: 20 });

    dom.window.eval(script);
    dom.window.initRotationControls();
    return { dom, doc, track, thumb };
}

function pointer(window, type, clientX) {
    const event = new window.MouseEvent(type, { bubbles: true, clientX, button: 0 });
    event.pointerId = 1;
    return event;
}

test('rotation control initialises the thumb and hidden value', () => {
    const { track, thumb, doc } = rotationWindow('2');
    assert.equal(track.getAttribute('aria-valuenow'), '2');
    assert.equal(doc.querySelector('.playback-order-value').value, '2');
    assert.equal(thumb.style.left, '31px');
    assert.match(thumb.querySelector('i').className, /bi-shuffle/);
});

test('clicking an option sets the nearest state', () => {
    const { dom, track, doc } = rotationWindow('1');
    track.dispatchEvent(pointer(dom.window, 'pointerdown', 70));
    track.dispatchEvent(pointer(dom.window, 'pointerup', 70));

    assert.equal(track.getAttribute('aria-valuenow'), '0');
    assert.equal(doc.querySelector('.playback-order-value').value, '0');
    assert.match(track.querySelector('.slider-thumb-container i').className, /bi-sort-up/);
});

test('dragging shows a tooltip with the current setting above the track', () => {
    const { dom, track, doc } = rotationWindow('1');
    const container = doc.querySelector('.playback-order-toggle-container');
    const tooltip = doc.querySelector('.rotation-tooltip');

    track.dispatchEvent(pointer(dom.window, 'pointerdown', 13));
    track.dispatchEvent(pointer(dom.window, 'pointermove', 70));

    assert.ok(container.classList.contains('is-dragging'));
    assert.equal(tooltip.textContent, 'oldest to newest');
    assert.equal(track.getAttribute('aria-valuetext'), 'oldest to newest');

    track.dispatchEvent(pointer(dom.window, 'pointerup', 70));
    assert.ok(!container.classList.contains('is-dragging'));
});

test('dragging the thumb across the track snaps to the nearest state', () => {
    const { dom, track, doc } = rotationWindow('1');
    track.dispatchEvent(pointer(dom.window, 'pointerdown', 13));
    track.dispatchEvent(pointer(dom.window, 'pointermove', 70));
    track.dispatchEvent(pointer(dom.window, 'pointerup', 70));

    assert.equal(track.getAttribute('aria-valuenow'), '0');
    assert.equal(doc.querySelector('.playback-order-value').value, '0');

    track.dispatchEvent(pointer(dom.window, 'pointerdown', 70));
    track.dispatchEvent(pointer(dom.window, 'pointermove', 13));
    track.dispatchEvent(pointer(dom.window, 'pointerup', 13));

    assert.equal(track.getAttribute('aria-valuenow'), '1');
    assert.equal(doc.querySelector('.playback-order-value').value, '1');
});
