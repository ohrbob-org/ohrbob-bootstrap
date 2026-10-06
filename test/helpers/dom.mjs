import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const here = path.dirname(fileURLToPath(import.meta.url));
const widgetSource = readFileSync(path.join(here, '..', '..', 'js', 'audio-widget.js'), 'utf8');

export function createDom() {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only' });
    dom.window.eval(widgetSource);
    return dom;
}

export function mount(attributes = {}) {
    const dom = createDom();
    const el = dom.window.document.createElement('audio-widget');
    for (const [name, value] of Object.entries(attributes)) {
        el.setAttribute(name, value);
    }
    dom.window.document.body.appendChild(el);
    return { dom, window: dom.window, document: dom.window.document, el };
}

export function record(el, types) {
    const log = [];
    for (const type of types) {
        el.addEventListener(type, (e) => log.push({ type, detail: e.detail }));
    }
    return log;
}