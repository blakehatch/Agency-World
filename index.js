import puppeteer from "puppeteer-core";

//Scrape LinkedIn, indeed, and builtinnyc

async function scrape(url, browser, parser) {
  const page = await browser.newPage();

  await page.setDefaultNavigationTimeout(2 * 60 * 1000);

  await page.goto(url);

  const body = await page.$('body');

  const html = await page.evaluate(() =>
      document.documentElement.outerHTML
  );

  console.log("HTML FROM " + url + ": ");
  console.log(html);

  console.log(parser(html));
}

async function parseIndeed() {

}

async function parseLinkedIn() {

}

async function parseBuildInNYC() {

}

async function run() {
  let browser;

  try {

    const auth = process.env.USERNAME + ':' + process.env.PASSWORD;

    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://${auth}@zproxy.lum-superproxy.io:9222`
    });

    await scrape('https://www.indeed.com/jobs?q=designer&l=new+york%2C+ny&vjk=50721f52d7302fd5', browser, parseLinkedIn);
    await scrape('https://www.builtinnyc.com/jobs/design-ux', browser, parseBuildInNYC);
    //TODO: Find URL that works for linkedin scraper
    //    await scrape('linkedin.com', browser);



    return;

  } catch (e) {
    console.error("scrape failed", e);
  } finally {
    await browser?.close();
  }
}

run();
