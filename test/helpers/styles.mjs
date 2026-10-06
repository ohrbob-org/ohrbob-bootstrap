import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as sass from 'sass';
import { JSDOM } from 'jsdom';
import { createDom } from './dom.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..', '..');

export function compileTheme() {
    const result = sass.compile(path.join(repoRoot, 'scss', 'theme.scss'), {
        loadPaths: [path.join(repoRoot, 'node_modules')],
        logger: sass.Logger.silent,
    });
    return result.css;
}

export function createStyledDom() {
    const css = compileTheme();
    const dom = createDom();
    const style = dom.window.document.createElement('style');
    style.textContent = css;
    dom.window.document.head.appendChild(style);
    
    const el = dom.window.document.createElement('audio-widget');
    dom.window.document.body.appendChild(el);
    
    return { dom, window: dom.window, document: dom.window.document, el };
}