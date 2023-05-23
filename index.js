import puppeteer from "puppeteer-core";
import * as dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

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

const openai = async (data) => {

  const prompt = `Here is a job description:\n\n${data}\n\nIs this description based off a job posting from a design agency? (YES/NO)`;

  const body = {
    "model": "text-davinci-003",
    "prompt": prompt,
    "max_tokens": 3,
  };

  const headers = {
    "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
    "Content-Type": "application/json",
  };

  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const result = await response.json();

  const text = result.choices[0].text
  
  return text.replace(/^\s+|\s+$/g, '').toUpperCase();
}

const getSingleIndeedListingSummary = async (page, job) => {

  if (!job.url) {
    return "NAN";
  }

  try {
    await page.goto(job.url);
    await page.waitForSelector("#jobDescriptionText");
  } catch(error) {
    return "NAN";
  }

  const description = await page.evaluate(() => {
    return document.getElementById("jobDescriptionText")?.innerText;
  })

  const isAgency = await openai(description);

  job.isAgency = isAgency;

  return job;
}

const getIndeedJobListings = async (page) => {

  const jobs = await page.evaluate(() => {
    const jobNodes = document.querySelectorAll('.jobsearch-ResultsList > li');
    const jobListings = Array.from(jobNodes).slice(0,5).map(jobNode => {
      const title = jobNode.querySelector('.jobTitle > a > span')?.innerText | "";
      const companyName = jobNode.querySelector('.companyName')?.innerText | "";
      const location = jobNode.querySelector('.companyLocation')?.innerText | "";
      const salary = jobNode.querySelector('.salary-snippet-container')?.innerText | "";
      const jobType = jobNode.querySelector('.metadataContainer > .metadata > div > svg[aria-label="Job type"]')?.nextSibling?.nodeValue | "";
      const shift = jobNode.querySelector('.metadataContainer > .metadata > div > svg[aria-label="Shift"]')?.nextSibling?.nodeValue | "";
      const experienceRequired = jobNode.querySelector('.metadataContainer > .attribute_snippet')?.innerText | "";
      const description = jobNode.querySelector('.job-snippet')?.innerText | "";
      const daysPosted = jobNode.querySelector('.result-footer > .date')?.innerText | "";
      const url = jobNode.querySelector("a")?.getAttribute("href") | "";
      return { title, companyName, location, salary, jobType, shift, experienceRequired, description, daysPosted, url };
    });
    return jobListings;
  });

  return jobs;
}

const parseLinkedIn = async () => {

}

const getBuiltInNYCJobListings = async (page) => {

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

const scrape = async (url, browser, selector, parser) => {
  const page = await browser.newPage();
  // await page.setViewport({
  //   width: 1512,
  //   height: 945,
  // });

  await page.setDefaultNavigationTimeout(2 * 60 * 1000);

  await page.goto(url);

  // Use the specific Indeed selector here, to make sure the page has loaded the relevant content
  await page.waitForSelector(selector);

  console.log("HTML FROM " + url + ": ");

  let jobs;
  try {
    jobs = await parser(page);
  } catch (error) {
    console.error(error);
    return Promise.reject("couldn't parse jobs.");
  }

  console.log(jobs);

  jobs = await Promise.allSettled(jobs.map((job) => {
    return getSingleIndeedListingSummary(page, job);
  }))

  return jobs;
}

const run = async () => {
  let browser;

  try {

    const auth = process.env.USERNAME + ':' + process.env.PASSWORD;

    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://${auth}@zproxy.lum-superproxy.io:9222`
    });

    const indeedSelector = ".jobsearch-ResultsList > li";
    const builtInNYCSelector = ".v-lazy.job-item";

    const jobs = await scrape('https://www.indeed.com/jobs?q=designer&l=new+york%2C+ny&radius=35&fromage=7',
        browser, indeedSelector, getIndeedJobListings);

    console.log(jobs);

    // await scrape('https://www.builtinnyc.com/jobs/design-ux', browser, builtInNYCSelector, getBuiltInNYCJobListings);
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
// openai()