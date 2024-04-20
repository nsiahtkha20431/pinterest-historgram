const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

async function downloadImage(page, imageUrl, imagePath) {
    console.log('Attempting to download image from URL:', imageUrl);
    const imageResponse = await page.goto(imageUrl);
    const buffer = await imageResponse.buffer();
    fs.writeFileSync(imagePath, buffer);
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

            const pinPage = await browser.newPage(); //opens new tab
            await pinPage.goto(href, { waitUntil: 'networkidle0', timeout: 10000 }); // navigate to pin's url
            const htmlContent = await pinPage.content(); // retrieves html content
            const $ = cheerio.load(htmlContent); // loads html content into cheerio for parsing

            // Extract createdAt and imageUrl (modify selectors as per actual HTML)
            const createdAt = $('#createdAtSelector').text();  // Modify selector based on actual HTML
            const imageUrl = $('#imageSelector').attr('src');   // Modify selector based on actual HTML

            // Save image
            const imageFileName = `pin-${openedPinsCount + 1}.jpg`;
            const imagePath = path.join(baseDirectory, imageFileName);
            await downloadImage(pinPage, imageUrl, imagePath);

            // Store metadata
            metadata.push({
                id: `pin-${openedPinsCount + 1}`,
                createdAt: createdAt,
                imageFilePath: imagePath
            });

            console.log(`Processed pin ${openedPinsCount + 1}`);

            await pinPage.close();
            openedPinsCount++;
            if (openedPinsCount >= 5) break; // Your limit condition
        }
    }

    // Save metadata to JSON
    fs.writeFileSync(path.join(baseDirectory, 'metadata.json'), JSON.stringify(metadata, null, 4));

    await browser.close();
}

const boardUrl = 'https://www.pinterest.ca/krazikhan/fashion/';
scrapePinterestBoard(boardUrl);
