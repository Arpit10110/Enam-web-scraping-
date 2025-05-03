import puppeteer from 'puppeteer';
import fs from 'fs';

const getautomated = async () => {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null, 
        args: ['--start-maximized'] 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto('https://in.search.yahoo.com/?fr2=inr');

    const searchInput = await page.waitForSelector('#yschsp');
    await searchInput.type('enam live price', { delay: 200 });
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const [newPage] = await Promise.all([
        new Promise(resolve => browser.once('targetcreated', async target => {
            const newPage = await target.page();
            await newPage.bringToFront();
            resolve(newPage);
        })),
        page.click('a[href="https://www.enam.gov.in/"]')
    ]);

    // Open the link directly on the next page
    await newPage.goto('https://enam.gov.in/web/dashboard/live_price', { waitUntil: 'networkidle2' });

    // Wait for the radio button to be visible
    await newPage.waitForSelector('input[type="radio"][value="blue"]', { visible: true });
    await newPage.click('input[type="radio"][value="blue"]');
    
    // Use delay instead of waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Wait for the commodity dropdown to be visible and fully loaded
    await newPage.waitForSelector('#min_max_commodity', { visible: true });
    
    // Wait for options to be fully loaded
    await newPage.waitForFunction(() => {
        const select = document.querySelector('#min_max_commodity');
        return select && select.options.length > 2; // Make sure multiple options are loaded
    }, { timeout: 10000 });
    
    // Try using standard JavaScript to select the option
    await newPage.evaluate(() => {
        const selectElement = document.querySelector('#min_max_commodity');
        if (selectElement) {
            // Look for the All option by examining each option's text
            for (let i = 0; i < selectElement.options.length; i++) {
                const option = selectElement.options[i];
                if (option.text.includes('All')) {
                    selectElement.selectedIndex = i;
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    selectElement.dispatchEvent(event);
                    return true;
                }
            }
            
            // If we didn't find it by text, try selecting the second option (index 1)
            if (selectElement.options.length > 1) {
                selectElement.selectedIndex = 1;
                const event = new Event('change', { bubbles: true });
                selectElement.dispatchEvent(event);
                return true;
            }
        }
        return false;
    });
    
    console.log('Attempted to select the "All" option');
    
    // Let the page settle after selection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Completed the selection process');
    
    // *** NEW CODE STARTS HERE - TABLE SCRAPING ***
    
    // Wait for the table to be fully loaded
    console.log('Waiting for the table to load...');
    await newPage.waitForSelector('table.table-bordered', { timeout: 30000 });
    
    // Give it an extra moment to ensure all data is loaded
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Scrape the table data
    console.log('Scraping table data...');
    const tableData = await newPage.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table.table-bordered tbody tr'));
        return rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            
            // Skip rows that don't have enough cells
            if (cells.length < 6) return null;
            
            return {
                "State": cells[0]?.textContent?.trim() || "",
                "APMC's": cells[1]?.textContent?.trim() || "",
                "Commodity": cells[2]?.textContent?.trim() || "",
                "Min Price": cells[3]?.textContent?.trim() || "",
                "Modal Price": cells[4]?.textContent?.trim() || "",
                "Max Price": cells[5]?.textContent?.trim() || ""
            };
        }).filter(item => item !== null); // Remove any null entries
    });

    console.log('Scraping completed!');
    
    // Output the data to console
    console.log(JSON.stringify(tableData, null, 2));
    
    // Save data to a JSON file
    fs.writeFileSync('enam_price_data.json', JSON.stringify(tableData, null, 2));
    console.log('Data saved to enam_price_data.json');
    
    // Keep browser open for debugging
    console.log('Browser kept open for debugging. Close it manually when done.');
    await browser.close();
};

getautomated();