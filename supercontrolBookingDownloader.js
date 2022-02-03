const fs = require('fs')
const puppeteer = require('puppeteer');
const logger = require('./logging')

async function download(startDate, endDate, username, password, path) {

    logger.info("downloading csv")

    const browser = await puppeteer.launch({
        slowMo: 1000,
        headless: true,
        args: [
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--disable-setuid-sandbox",
            "--no-sandbox",
        ]
      });


    const page = await browser.newPage();
    await page.goto('https://secure.supercontrol.co.uk/index.asp');

    await page.$eval('input[data-test-id="LoginUsername"]', (el, value) => el.value = value, username);
    await page.$eval('input[data-test-id="LoginPassword"]', (el, value) => el.value = value, password);
    await page.click('#LoginSubmit');

    await page.waitForTimeout(5000)

    logger.info("log into supercontrol successful")

    let csvUrl = getDownloadUrl(startDate, endDate);

    let response 
    try {
        response = await page.evaluate(downloadUrl => {
            return fetch(downloadUrl, {
                method: 'GET',
                credentials: 'include'
            }).then(r => r.text())
            .catch(e => console.log(e));
        }, csvUrl);
    } catch (e) {
        console.log(e)
    }

    fs.writeFileSync(path, response);

    await page.waitForTimeout(5000)

    await browser.close();

    logger.info("downloaded csv")
}

function getDownloadUrl(startDate, endDate) {
    let isoStartDate = startDate.toISOString().split('T')[0];

    let isoEndDate = endDate.toISOString().split('T')[0];

    return `https://secure.supercontrol.co.uk/control/convertCSV.asp?fn=arrivals-departures&table=arrivals_mobile.asp%3Fstartdate%3D${isoStartDate}%26enddate%3D${isoEndDate}%26report_type%3Dad%26cleanerID%3D%26managerID%3D%26ownerbookings%3Dfalse%26crossupdateID%3Dfalse%26arrivals_hideArchived%3Dfalse%26arrivals_propertyclosed%3Dfalse%26arrivals_arrived%3Dfalse%26action%3DLoadReport%26format%3Dcsv`;
}

module.exports = download

