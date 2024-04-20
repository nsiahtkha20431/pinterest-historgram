const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

async function downloadImageFromPin(page, pinSelector, baseDirectory, pinId) {
    const htmlContent = await page.content();
    const $ = cheerio.load(htmlContent);
    const imageUrl = $(pinSelector).attr('src');

    if (!imageUrl) {
        console.log('Image URL not found for pin:', pinId);
        return;
    }

    console.log('Attempting to download image from URL:', imageUrl);
    const imageResponse = await page.goto(imageUrl);
    const buffer = await imageResponse.buffer();
    const imagePath = path.join(baseDirectory, `pin-${pinId}.jpg`);
    fs.writeFileSync(imagePath, buffer);
    return imagePath; // Return the image path for use in metadata
}

async function scrapePinterestBoard(pinterestBoardURL) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(pinterestBoardURL, { waitUntil: 'networkidle0' });

    const pinLinkSelector = 'a[href*="/pin/"]';
    let openedPinsCount = 0;
    let processedHrefs = new Set();
    const baseDirectory = path.join(__dirname, 'pins');
    const metadata = [];
    fs.mkdirSync(baseDirectory, { recursive: true }); // Ensure the directory exists

    while (openedPinsCount < 10) {
        await page.waitForSelector(pinLinkSelector, { visible: true });
        const pinLinks = await page.$$(pinLinkSelector);

        for (const pinLink of pinLinks) {
            const href = await (await pinLink.getProperty('href')).jsonValue();
            if (processedHrefs.has(href)) continue;
            processedHrefs.add(href);

            const pinPage = await browser.newPage();
            await pinPage.goto(href, { waitUntil: 'networkidle0', timeout: 10000 });

            const imagePath = await downloadImageFromPin(pinPage, '.hCL.kVc.L4E', baseDirectory, openedPinsCount + 1);

            if (imagePath) {
                // Store metadata only if the image was successfully downloaded
                metadata.push({
                    id: `pin-${openedPinsCount + 1}`,
                    imageFilePath: imagePath
                });
            }

            console.log(`Processed pin ${openedPinsCount + 1}`);

            await pinPage.close();
            openedPinsCount++;
            if (openedPinsCount >= 10) break; // Stop when 10 pins have been processed
        }

        // Check if we've reached the desired number of processed pins
        if (openedPinsCount >= 10) break;
    }

    // Save metadata to JSON
    fs.writeFileSync(path.join(baseDirectory, 'metadata.json'), JSON.stringify(metadata, null, 4));

    await browser.close();
}

const boardUrl = 'https://www.pinterest.ca/krazikhan/fashion/';
scrapePinterestBoard(boardUrl);