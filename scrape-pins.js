const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const { loadData, prepareChartData, generateChart } = require('./create-chart.js');

const baseDirectory = path.join(__dirname, 'pins');

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

function runCLIPModel(imagePath) {
    return new Promise((resolve, reject) => {
        exec(`python "${path.join(__dirname, 'clip-script.py')}" "${imagePath}"`, (error, stdout, stderr) => { //executes command in shell: running clip-script with the image path as argument
            if (error) {
                console.error(`Execution error: ${error}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`Error: ${stderr}`);
                return reject(stderr);
            }
            console.log(`CLIP Style Prediction: ${stdout}`);
            try {
                const dominantStyle = stdout.trim(); // Since stdout includes a newline at the end
                resolve(dominantStyle);
            } catch (parseError) {
                console.error('Failed to parse output:', parseError);
                reject(parseError);
            }
        });
    });
}

async function scrapePinterestBoard(pinterestBoardURL) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(pinterestBoardURL, { waitUntil: 'networkidle0' });

    const pinLinkSelector = 'a[href*="/pin/"]';
    let openedPinsCount = 0;
    let processedHrefs = new Set();
    const metadata = [];
    fs.mkdirSync(baseDirectory, { recursive: true });

    while (openedPinsCount < 1000) {
        await page.waitForSelector(pinLinkSelector, { visible: true });
        let pinLinks = await page.$$(pinLinkSelector);

        for (const pinLink of pinLinks) {
            const href = await (await pinLink.getProperty('href')).jsonValue();
            if (processedHrefs.has(href)) continue;
            processedHrefs.add(href);

            const pinPage = await browser.newPage();
            await pinPage.goto(href, { waitUntil: 'networkidle0', timeout: 30000 });

            const pageSource = await pinPage.evaluate(() => document.documentElement.outerHTML);
            const createdAt = extractCreatedAtFromJSON(pageSource);  
            const imagePath = await downloadImageFromPin(pinPage, '.hCL.kVc.L4E', baseDirectory, openedPinsCount + 1);

            if (imagePath) {
                const dominantStyle = await runCLIPModel(imagePath); // Wait for the dominant style prediction
                metadata.push({
                    id: `pin-${openedPinsCount + 1}`,
                    imageFilePath: imagePath,
                    createdAt: createdAt,
                    style: dominantStyle
                });
                console.log(`Processed pin ${openedPinsCount + 1} with style ${dominantStyle}`);
            }

            await pinPage.close();
            openedPinsCount++;
            if (openedPinsCount >= 1000) break;

            if (openedPinsCount % 4 === 0) {
                await page.evaluate('window.scrollBy(0, window.innerHeight)');
                await new Promise(resolve => setTimeout(resolve, 2000));
                pinLinks = await page.$$(pinLinkSelector);
            }
        }

        if (openedPinsCount >= 1000) break;
    }

    fs.writeFileSync(path.join(baseDirectory, 'metadata.json'), JSON.stringify(metadata, null, 4));
    await browser.close();

    // create chart
    // const filePath = path.join(baseDirectory, 'metadata.json');
    // const data = loadData(filePath);
    // const chartData = prepareChartData(data);
    // generateChart(chartData);
}

async function main() {
    const boardUrl = 'https://www.pinterest.ca/krazikhan/fashion/';
    await scrapePinterestBoard(boardUrl);

    // create chart
    const filePath = path.join(baseDirectory, 'metadata.json');
    const data = loadData(filePath);
    const chartData = prepareChartData(data);

    try {
        const chartUrl = await generateChart(chartData);
        console.log('Chart generated successfully:', chartUrl);
        
        // Optionally open the chart URL in the default browser
        try {
            const open = (await import('open')).default;
            await open(chartUrl);
        } catch (importError) {
            console.log('Chart URL:', chartUrl);
            console.error('Failed to automatically open the chart. Please open the URL manually.');
        }
    } catch (error) {
        console.error('Failed to generate chart:', error);
    }
}

main().catch(error => console.error('Main function error:', error));