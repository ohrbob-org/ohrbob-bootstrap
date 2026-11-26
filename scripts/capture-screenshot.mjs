import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const imagesDir = path.join(rootDir, 'images');
const url = `file://${path.join(rootDir, 'index.html')}`;

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
page.setDefaultTimeout(60000);

async function open(theme, width = 1440, height = 1100) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(`${url}?theme=${theme}`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
}

async function captureTab(selector, file, width = 1440, height = 1100) {
    await open(file.includes('light') ? 'light' : 'dark', width, height);
    await page.evaluate((sel) => {
        const trigger = document.querySelector(`[data-bs-target="${sel}"]`);
        if (trigger) trigger.click();
    }, selector);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const element = await page.$(selector);
    if (!element) throw new Error(`Missing preview pane ${selector}`);
    await element.screenshot({ path: path.join(imagesDir, file) });
    console.log(`saved images/${file}`);
}

await captureTab('#preview-player', 'screenshot.png');
await captureTab('#preview-player', 'screenshot-light.png');
await captureTab('#preview-stations', 'stations-dark.png');
await captureTab('#preview-stations', 'stations-light.png');
await captureTab('#preview-connect', 'connect-dark.png');

await captureTab('#preview-stations', 'mobile-stations.png', 430, 1000);
await captureTab('#preview-player', 'mobile-player.png', 430, 1000);
await captureTab('#preview-playlist', 'mobile-playlist.png', 430, 1000);

await browser.close();
