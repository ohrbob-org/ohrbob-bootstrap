import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

(async () => {
    console.log('Capturing screenshot of index.html...');
    const imagesDir = path.join(rootDir, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1200, height: 1800 });
    
    const filePath = `file://${path.join(rootDir, 'index.html')}`;
    await page.goto(filePath, { waitUntil: 'networkidle0' });
    
    await page.screenshot({ path: path.join(imagesDir, 'screenshot.png'), fullPage: true });
    
    await browser.close();
    console.log('Screenshot saved to images/screenshot.png');
})();
