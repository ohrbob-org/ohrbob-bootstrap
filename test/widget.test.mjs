import test from 'node:test';
import assert from 'node:assert/strict';
import { mount } from './helpers/dom.mjs';

test('renders full-width bar structure', () => {
    const { el } = mount({ station: 'Test', track: 'T', artist: 'A' });
    const bar = el.querySelector('.audio-bar');
    assert.ok(bar);
    
    // Test groups
    const groups = [...bar.children].map(c => c.className.split(' ')[0]);
    assert.deepEqual(groups, [
        'audio-meta',
        'audio-controls',
        'audio-progress-group',
        'audio-volume-group',
        'btn-menu'
    ]);
});