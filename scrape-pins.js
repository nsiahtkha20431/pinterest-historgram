const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapePinterestBoard(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const pinLinkSelector = 'a[href*="/pin/"]';
    let openedPinsCount = 0;
    let processedHrefs = new Set();
    const baseDirectory = path.join(__dirname, 'downloaded-html-sources'); // Base directory for saving files
    fs.mkdirSync(baseDirectory, { recursive: true }); // Ensure the directory exists

    while (openedPinsCount < 10) {
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
                timeout: 10000 // Timeout in milliseconds
            });

            const pageSource = await pinPage.evaluate(() => document.documentElement.outerHTML);

            // Create a unique file path for each pin
            const fileName = `pin-source-${openedPinsCount + 1}.html`;
            const sourceFilePath = path.join(baseDirectory, fileName);
            fs.writeFileSync(sourceFilePath, pageSource);
            console.log(`Page source of pin ${openedPinsCount + 1} saved to ${sourceFilePath}`);

            await pinPage.close();
            openedPinsCount++;
            if (openedPinsCount >= 5) break;
        }
    }

    await browser.close();
}

const boardUrl = 'https://www.pinterest.ca/krazikhan/fashion/';
scrapePinterestBoard(boardUrl);