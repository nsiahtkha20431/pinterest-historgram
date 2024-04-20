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

function extractCreatedAtFromJSON(htmlContent) {
    const $ = cheerio.load(htmlContent);
    const scriptContent = $('script[data-relay-response="true"]').html();
    try {
        const jsonData = JSON.parse(scriptContent);
        const createdAtRFC2822 = jsonData.response.data.v3GetPinQuery.data.createdAt;
        const date = new Date(createdAtRFC2822);

        // Format the date as "DD MMM YYYY"
        const formattedDate = date.toLocaleDateString('en-GB', {
            day: '2-digit',   // two digit day
            month: 'short',  // abbreviated month
            year: 'numeric'  // four digit year
        });

        return formattedDate;  // Returns date in the format "17 Apr 2024"
    } catch (error) {
        console.error("Failed to parse JSON data or extract 'createdAt'", error);
        return null;  // Return null if parsing fails
    }
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
    fs.mkdirSync(baseDirectory, { recursive: true });

    while (openedPinsCount < 10) {
        await page.waitForSelector(pinLinkSelector, { visible: true });
        let pinLinks = await page.$$(pinLinkSelector);

        for (const pinLink of pinLinks) {
            const href = await (await pinLink.getProperty('href')).jsonValue();
            if (processedHrefs.has(href)) continue;
            processedHrefs.add(href);

            const pinPage = await browser.newPage();
            await pinPage.goto(href, { waitUntil: 'networkidle0', timeout: 10000 });

            const pageSource = await pinPage.evaluate(() => document.documentElement.outerHTML);
            const createdAt = extractCreatedAtFromJSON(pageSource);  // Extract createdAt using the new function

            const imagePath = await downloadImageFromPin(pinPage, '.hCL.kVc.L4E', baseDirectory, openedPinsCount + 1);

            if (imagePath) {

                metadata.push({
                    id: `pin-${openedPinsCount + 1}`,
                    imageFilePath: imagePath,
                    createdAt: createdAt  
                });
            }

            console.log(`Processed pin ${openedPinsCount + 1}`);

            await pinPage.close();
            openedPinsCount++;
            if (openedPinsCount >= 10) break;

            if (openedPinsCount % 4 === 0) {
                await page.evaluate('window.scrollBy(0, window.innerHeight)');
                await page.waitForTimeout(2000);
                pinLinks = await page.$$(pinLinkSelector);
            }
        }

        if (openedPinsCount >= 10) break;
    }

    fs.writeFileSync(path.join(baseDirectory, 'metadata.json'), JSON.stringify(metadata, null, 4));

    await browser.close();
}

const boardUrl = 'https://www.pinterest.ca/krazikhan/fashion/';
scrapePinterestBoard(boardUrl);