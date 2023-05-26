import { chromium } from "playwright";
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

///////////////////////////////////////////////////////////////////
////////////// OpenAI API Call Text Completion ////////////////////
///////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////
///////////////// Specific site scraping logic ////////////////////
///////////////////////////////////////////////////////////////////

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

const setPage = async (context, mappedData) => {

  const page = await context.newPage();
  page.setDefaultTimeout(1_000);

  try {
    await page.goto(mappedData.url, { timeout: 2_000 });
    await page.waitForSelector(mappedData.waitFor, {
      state: "attached",
      timeout: 5_000,
      strict: false,
    });
  } catch (error) {
    console.log("TIMEOUT in goto / waitForSelector", error.message);
    await page.close();
    return Promise.reject("TIMEOUT in goto / waitForSelector" + error.message)
  }


  return page;
}

const doesExist = async (locator) => {

  let count;
  try {
    count = await locator.count();
  } catch (error) {
    return false;
  }
  return count > 0;
}

const getIndeedJobListings = async (context, mappedData) => {

  console.log("FETCHING indeed");

  let page;
  try {
    page = await setPage(context, mappedData);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page");
  }

  const locator = page.locator(mappedData.selector);

  const count = await locator.count();

  const results = [];

  for (let i = 0; i < count; i++) {
    let curLoc = locator.nth(i);

    let title = curLoc.locator(".jobTitle > a > span")
    let company = curLoc.locator(".companyName")
    let location = curLoc.locator(".companyLocation")
    let salary = curLoc.locator(".salary-snippet-container")
    let description = curLoc.locator(".job-snippet")
    let daysPosted = curLoc.locator(".result-footer > .date")
    let url = curLoc.locator(".resultContent a:nth-child(1)")

    const toCheck = [title, company, location, salary, description, daysPosted, url];

    let exists = await Promise.all(toCheck.map((locator) => doesExist(locator)));

    title = exists[0] ? await title.innerText() : "";
    company = exists[1] ? await company.innerText() : "";
    location = exists[2] ? await location.innerText() : "";
    salary = exists[3] ? await salary.innerText() : "";
    description = exists[4] ? await description.innerText() : "";
    daysPosted = exists[5] ? await daysPosted.innerText() : "";
    url = exists[6] ? "https://www.indeed.com" + await url.first().getAttribute("href") : "";

    results.push({ source: "indeed", title, company, location, salary, description, daysPosted, url });
  };

  await page.close();

  return results;
}

const parseLinkedIn = async () => {

}

const getBuiltInNYCJobListings = async (context, mappedData) => {

  console.log("FETCHING builtinnyc");

  let page;
  try {
    page = await setPage(context, mappedData);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page");
  }

  const locator = page.locator(mappedData.selector);

  const count = await locator.count();

  const results = [];

  for (let i = 0; i < count; i++) {
    let curLoc = locator.nth(i);

    let title = curLoc.locator(".job-title")
    let company = curLoc.locator(".company-title > .param-value")
    let location = curLoc.locator(".info-label.location > .param-value")
    let description = curLoc.locator(".job-description")
    let url = curLoc.locator(".job-details-link")

    const toCheck = [title, company, location, description, url];

    let exists = await Promise.all(toCheck.map((locator) => doesExist(locator)));

    title = exists[0] ? await title.innerText() : "";
    company = exists[1] ? await company.innerText() : "";
    location = exists[2] ? await location.innerText() : "";
    description = exists[3] ? await description.innerText() : "";
    url = exists[4] ? await url.getAttribute("href") : "";

    results.push({ source: "builtinnyc", title, company, location, description, url });
  };

  await page.close();

  return results;
}

///////////////////////////////////////////////////////////////////
///////////////////////// Main Task ///////////////////////////////
///////////////////////////////////////////////////////////////////

const run = async () => {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent: "Chrome/58.0. 3029.110",
    viewport: { width: 1512, height: 945 },
  });

  const mapper = {
    indeed: {
      url: "https://www.indeed.com/jobs?q=designer&l=new+york%2C+ny&radius=35&fromage=7",
      waitFor: ".jobsearch-LeftPane",
      selector: ".jobsearch-ResultsList > li:not(:has(.nonJobContent-desktop))",
    },
    builtin: {
      url: "https://www.builtinnyc.com/jobs/design-ux",
      waitFor: ".jobs.show_incentive",
      selector: ".job-item",
    },
  };

  const jobs = []

  const datas = await Promise.allSettled([
    getIndeedJobListings(context, mapper.indeed),
    getBuiltInNYCJobListings(context, mapper.builtin)
  ])

  datas.forEach((data) => {
    if (data.status === "fulfilled") {
      data.value.forEach((job) => {
        jobs.push(job);
      }
    )}
  })

  await context.close();
  await browser.close();

  console.log(jobs);

  return;
};

run();
// openai()