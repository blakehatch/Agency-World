import puppeteer from "puppeteer-core";
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

//Scrape LinkedIn, indeed, and builtinnyc

// async function scrape(url, browser, selector, parser) {
//   const page = await browser.newPage();
//
//   await page.setDefaultNavigationTimeout(2 * 60 * 1000);
//
//   await page.goto(url);
//
//   await page.waitForSelector(selector);
//
//   const el = await page.$(selector);
//
//   //const text = await el.evaluate(e => e.innerHTML);
//
//   console.log("HTML FROM " + url + ": ");
//
//   parser(el).then(console.log).catch(console.error);
// }

async function scrape(url, browser, selector, parser) {
  const page = await browser.newPage();

  await page.setDefaultNavigationTimeout(2 * 60 * 1000);

  await page.goto(url);

  // Use the specific Indeed selector here, to make sure the page has loaded the relevant content
  await page.waitForSelector(selector);

  console.log("HTML FROM " + url + ": ");

  try {
    const jobs = await parser(page);
    console.log(jobs);
  } catch (error) {
    console.error(error);
  }
}

async function getIndeedJobListings(page) {

  const jobs = await page.evaluate(() => {
    const jobNodes = document.querySelectorAll('.jobsearch-ResultsList > li');
    const jobListings = Array.from(jobNodes).map(jobNode => {
      const title = jobNode.querySelector('.jobTitle > a > span')?.innerText;
      const companyName = jobNode.querySelector('.companyName')?.innerText;
      const location = jobNode.querySelector('.companyLocation')?.innerText;
      const salary = jobNode.querySelector('.salary-snippet-container')?.innerText;
      const jobType = jobNode.querySelector('.metadataContainer > .metadata > div > svg[aria-label="Job type"]')?.nextSibling?.nodeValue;
      const shift = jobNode.querySelector('.metadataContainer > .metadata > div > svg[aria-label="Shift"]')?.nextSibling?.nodeValue;
      const experienceRequired = jobNode.querySelector('.metadataContainer > .attribute_snippet')?.innerText;
      const description = jobNode.querySelector('.job-snippet')?.innerText;
      const daysPosted = jobNode.querySelector('.result-footer > .date')?.innerText;
      return { title, companyName, location, salary, jobType, shift, experienceRequired, description, daysPosted };
    });
    return jobListings;
  });

  return jobs;
}

async function parseLinkedIn() {

}

async function getBuiltInNYCJobListings(page) {

  const jobs = await page.evaluate(() => {
    const jobNodes = document.querySelectorAll('.v-lazy.job-item');
    const jobListings = Array.from(jobNodes).map(jobNode => {
      const title = jobNode.querySelector('.job-title')?.innerText;
      const companyName = jobNode.querySelector('.company-title > .param-value')?.innerText;
      const location = jobNode.querySelector('.info-label.location > .param-value')?.innerText;
      const jobType = jobNode.querySelector('.info-label.hybrid > .param-value')?.innerText;
      const description = jobNode.querySelector('.job-description')?.innerText;
      const jobLink = jobNode.querySelector('.job-details-link')?.getAttribute("href");
      const logoLink = jobNode.querySelector('.logo > img')?.getAttribute("src");
      return { title, companyName, location, jobType, description, jobLink, logoLink };
    });
    return jobListings;
  });

  return jobs;
}

async function run() {
  let browser;

  try {

    const auth = process.env.USERNAME + ':' + process.env.PASSWORD;

    console.log(auth);

    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://${auth}@zproxy.lum-superproxy.io:9222`
    });

    const indeedSelector = ".jobsearch-ResultsList > li";
    const builtInNYCSelector = ".v-lazy.job-item";

    await scrape('https://www.indeed.com/jobs?q=designer&l=new+york%2C+ny&vjk=50721f52d7302fd5',
        browser, indeedSelector, getIndeedJobListings);

    await scrape('https://www.builtinnyc.com/jobs/design-ux', browser, builtInNYCSelector, getBuiltInNYCJobListings);
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
