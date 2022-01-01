// const csvDownloader = require('./superControlCSVDownloader')

// csvDownloader()

const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        //headless: false, // Especificamos que el navegador no es headless
        slowMo: 1000 // Añadimos un delay de 1 segundo entre cada comando.
      });

    browser.on('targetchanged', target => console.log('targetchanged--->' + target.url()));
    //browser.on('disconnected', target => console.log('disconnected--->' + target.url()));
    browser.on('targetcreated', target => console.log('targetcreated--->' + target.url()));
    browser.on('targetdestroyed', target => console.log('targetdestroyed--->' + target.url()));


//     browser.on('disconnected')
// browser.on('targetchanged')
// browser.on('targetcreated')
// browser.on('targetdestroyed')


    const page = await browser.newPage();
    await page.goto('https://secure.supercontrol.co.uk/index.asp');

    //await page.waitForSelector('input[name=search]');

    await page.$eval('input[data-test-id="LoginUsername"]', el => el.value = 'andres@dublincityapartments.ie');
    await page.$eval('input[data-test-id="LoginPassword"]', el => el.value = 'Briego912Celeste:)');
    await page.click('#LoginSubmit');

    await page.waitForTimeout(5000)

    await page.goto('https://secure.supercontrol.co.uk/control/arrivals.asp')

    // //await page.waitForSelector("#RemModal > div > div > div.modal-header > button > span");
    // //await page.click("#RemModal > div > div > div.modal-header > button > span");
    // await page.click("#collapsed > ul:nth-child(1) > li:nth-child(4) > a");
    // await page.click("li.dropdown:nth-child(12) > a:nth-child(1)");
    // await page.click("li.dropdown:nth-child(12) > ul:nth-child(2) > li:nth-child(3) > a:nth-child(1)");

    let url = 'https://secure.supercontrol.co.uk/control/convertCSV.asp?fn=arrivals-departures&table=arrivals_mobile.asp%3Fstartdate%3D2021-12-19%26enddate%3D2021-12-19%26report_type%3Dad%26cleanerID%3D%26managerID%3D%26ownerbookings%3Dfalse%26crossupdateID%3Dfalse%26arrivals_hideArchived%3Dfalse%26arrivals_propertyclosed%3Dfalse%26arrivals_arrived%3Dfalse%26action%3DLoadReport%26format%3Dcsv'
    
    await page.click("img.button:nth-child(3)");

    await page.waitForTimeout(5000)

    // const element = await this.page.$('input[data-test-id="LoginUsername"]');
    // if (element) {
    //     await element.click();
    //     console.log('element clicked');
    // }
    // else {
    // console.log('element not found');
    // }

    await browser.close();
})();

