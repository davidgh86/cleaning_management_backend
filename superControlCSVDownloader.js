// const {Builder, By, Key, until, chrome} = require('selenium-webdriver');

// // var webdriver = require('selenium-webdriver')

// // var capability = webdriver.Capabilities
// //         .phantomjs()
// //         .set('phantomjs.cli.args', '--ignore-ssl-errors=true');

// // var driver = new webdriver
// //         .Builder()
// //         .withCapabilities(capability)
// //         .build();

// async function example() {
//   //let driver = await new Builder().forBrowser('firefox').build();
//   let driver = await new Builder()
//     .forBrowser('chrome')
//     .setChromeOptions(new chrome.Options().addArguments(['--headless','--no-sandbox', '--disable-dev-shm-usage']))
//     .build();
    
//   try {
//     await driver.get('https://secure.supercontrol.co.uk/index.asp');
//     await driver.findElement(By.id('username-form-group')).findElement(By.css('input[data-test-id="LoginUsername"]')).sendKeys('andres@dublincityapartments.ie');
//     await driver.findElement(By.id('password-form-group')).findElement(By.css('input[data-test-id="LoginPassword"]')).sendKeys('Briego912Celeste:)');
//     await driver.findElement(By.id('LoginSubmit')).click();
//     await driver.wait(until.titleIs('Payment reminders : SuperControl'), 1000);
//     await driver.findElement(By.css("#collapsed > ul:nth-child(1) > li:nth-child(4) > a")).click();
//     await driver.findElement(By.css("li.dropdown:nth-child(12) > a:nth-child(1)")).click();
//     await driver.findElement(By.css("li.dropdown:nth-child(12) > ul:nth-child(2) > li:nth-child(3) > a:nth-child(1)")).click();
//     await driver.findElement(By.css("img.button:nth-child(3)")).click();
//    // await driver.findElement(By.linkText('Arrivals & departures')).click();
    
//     // await driver.findElement(By.css("#collapsed > ul:nth-child(1) > li:nth-child(4) > a")).click();
//     // await driver.findElement(By.css("ul.nav:nth-child(1) > li:nth-child(4) > ul:nth-child(2) > li:nth-child(10) > a:nth-child(1)")).click();
//     // await driver.wait(until.titleIs('Search bookings : SuperControl'), 1000);
//     // await driver.findElement(By.css("a.show-date-filter-link")).click();
//     // await driver.findElement(By.css("#enddate > span:nth-child(2)")).click();
//     // await driver.findElement(By.css(".today")).click();
//     // await driver.findElement(By.id("date_option_2")).click();
//     // await driver.findElement(By.css("#date_option_2 > option:nth-child(3)")).click();
//     // await driver.findElement(By.css("#enddate_2 > span:nth-child(2)")).click();
//     // await driver.findElement(By.css(".today")).click();
//     // await driver.findElement(By.name("Submit")).click();

//     // a = await driver.findElement(By.css("#ajax_data > div:nth-child(1) > p:nth-child(1) > strong:nth-child(1)"));
//     // b = await a.getAttribute("innerHTML")
//     console.log("sdfasfd")
//   } finally {
//     await driver.quit();
//   }
// };



module.exports = example;