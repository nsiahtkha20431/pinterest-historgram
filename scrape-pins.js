const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const path = require('path');

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                  .on('error', reject)
                  .once('close', () => resolve(filepath));
            } else {
                res.resume(); // Consume response data to free up memory
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
}

async function scrapePinterestBoard(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const pinLinkSelector = 'a[href*="/pin/"]';
    let openedPinsCount = 0;
    let processedHrefs = new Set();

    while (openedPinsCount < 5) {
        await page.waitForSelector(pinLinkSelector, { visible: true });
        const pinLinks = await page.$$(pinLinkSelector);

        for (const pinLink of pinLinks) {
            const href = await (await pinLink.getProperty('href')).jsonValue();

            if (processedHrefs.has(href)) {
                continue;
            }
            processedHrefs.add(href);

            const pinPage = await browser.newPage();
            await pinPage.goto(href, {
                waitUntil: 'networkidle0',
                timeout: 10000 // Timeout in milliseconds, e.g., 10000 for 10 seconds
            });

            // If you know a specific element that appears after the dynamic content is loaded, use it here
            // await pinPage.waitForSelector("created_at", { visible: true });

            const pageSource = await pinPage.evaluate(() => document.documentElement.outerHTML);

            // Overwrite the same file with the page source of the current pin
            const sourceFilePath = path.join(__dirname, 'temp-pin-source.html');
            fs.writeFileSync(sourceFilePath, pageSource);
            console.log(`Page source of current pin saved to ${sourceFilePath}`);

            // Regular expression and extraction logic for 'created_at' can be added here
            // ...

            await pinPage.close();
            openedPinsCount++;
        }
    }

    await browser.close();
}

const boardUrl = 'https://www.pinterest.ca/krazikhan/fashion/';
scrapePinterestBoard(boardUrl);