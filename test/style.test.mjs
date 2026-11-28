import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

test('body type uses the system UI stack without Inter', () => {
    const css = compileTheme();
    assert.ok(!/['"]Inter['"]/.test(css), 'the theme must not reference Inter');
    assert.match(css, /--metro-body:\s*"Segoe UI",\s*system-ui/);
    assert.ok(!fs.existsSync(new URL('../css/fonts/inter-var.woff2', import.meta.url)),
        'the Inter font file is no longer vendored');
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.ok(!html.includes('fonts.googleapis.com'),
        'the preview must not load Inter from the Google Fonts CDN');
});

test('night scope exposes the translated dark tokens', () => {
    const css = compileTheme();
    for (const token of [
        '--metro-night-surface', '--metro-night-border', '--metro-night-field',
        '--metro-night-field-rule', '--metro-night-text', '--metro-night-muted',
        '--metro-night-faint', '--metro-night-accent',
    ]) {
        assert.ok(css.includes(token), token);
    }
    assert.match(css, /\.metro-night\s*{[^}]*--metro-canvas:\s*#0e0f13/s);
    assert.match(css, /\.metro-night\s*{[^}]*color-scheme:\s*dark/s);
    assert.ok(!css.includes('#cc080d18'), 'ARGB values must never be copied into CSS');
});

test('dark mode uses role emphasis for outline buttons and text utilities', () => {
    const css = compileTheme();
    for (const role of ['primary', 'secondary', 'danger', 'warning']) {
        const rule = new RegExp(
            `\\[data-bs-theme=dark\\] \\.btn-outline-${role}\\s*{[^}]*--bs-btn-color:\\s*var\\(--bs-${role}-text-emphasis\\)`,
            's');
        assert.match(css, rule, `btn-outline-${role} uses the dark emphasis token`);
        const textRule = new RegExp(
            `\\[data-bs-theme=dark\\] \\.text-${role}\\s*{[^}]*color:\\s*var\\(--bs-${role}-text-emphasis\\)\\s*!important`,
            's');
        assert.match(css, textRule, `.text-${role} uses the dark emphasis token`);
    }
});

test('checkbox and radio controls stay square at utility specificity', () => {
    const { window, document } = createStyledDom();
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.className = 'form-check-input';
    document.body.append(checkbox, radio);

    assert.equal(window.getComputedStyle(checkbox).borderRadius, '0px');
    assert.equal(window.getComputedStyle(radio).borderRadius, '0px');
    const css = compileTheme();
    assert.match(css,
        /\.form-check-input\[type=checkbox\],[^{]*\.form-check-input\[type=radio\]\s*{[^}]*border-radius:\s*0/s);
});

test('switch tracks stay pill-shaped while checkboxes and radios stay square', () => {
    const { window, document } = createStyledDom();

    const wrap = document.createElement('div');
    wrap.className = 'form-check form-switch';
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.className = 'form-check-input';
    wrap.appendChild(toggle);
    document.body.appendChild(wrap);

    assert.equal(window.getComputedStyle(toggle).borderRadius, '2em');
    assert.match(compileTheme(),
        /\.form-check\.form-switch \.form-check-input\s*{[^}]*border-radius:\s*2em/s,
        'the switch rule must outrank the square checkbox rule');
});
