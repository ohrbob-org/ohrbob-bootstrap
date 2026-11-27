import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('apply script preserves the web audio widget and ships the fonts', () => {
    const sh = readFileSync(path.join(root, 'scripts/apply-theme.sh'), 'utf8');
    assert.ok(!/cp\s+"?js\/audio-widget\.js/.test(sh), 'must not overwrite the web audio widget');
    assert.ok(sh.includes('css/fonts'), 'must copy the bundled fonts');
    assert.ok(sh.includes('theme.css.map'), 'must copy the source map advertised by theme.css');
});
