import { chromium } from "playwright";
import fs from "fs";


///////////////////////////////////////////////////////////////////
///////////////// General Web Scraping Helpers ////////////////////
///////////////////////////////////////////////////////////////////

const setPage = async (context, url, waitFor) => {

  console.log(`FETCHING ${url}`);

  const page = await context.newPage();
  page.setDefaultTimeout(1_000);

  try {
    await page.goto(url, { timeout: 2_000 });
    await page.waitForSelector(waitFor, {
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


///////////////////////////////////////////////////////////////////
///////////////// Specific site scraping logic ////////////////////
///////////////////////////////////////////////////////////////////

const greenhouse = async (context, url, waitFor) => {
  const board = "greenhouse"

  let page;
  try {
    page = await setPage(context, url, waitFor);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page");
  }

  const company = await page.locator("h1").innerText();

  const locator = page.locator("div.opening");
  const count = await locator.count();

  console.log(`${count} jobs found in ${url}`)

  const results = [];

  for (let i = 0; i < count; i++) {
    let curLoc = locator.nth(i);

    let title = curLoc.locator("a")
    let location = curLoc.locator("span.location")
    let link = "";
    let description = "";

    const toCheck = [title, location];

    let exists = await Promise.all(toCheck.map((locator) => doesExist(locator)));

    link = exists[0] ? "https://boards.greenhouse.io" + await title.getAttribute("href") : "";
    title = exists[0] ? await title.innerText() : "";
    location = exists[1] ? await location.innerText() : "";

    results.push({board, company, title, link, location, description})

  }

  return results;
}

const lever = async (context, url, waitFor) => {
  const board = "lever"
  
  let page;
  try {
    page = await setPage(context, url, waitFor);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page");
  }

  const company = new URL(url).pathname.replace("/","");

  const locator = page.locator("div.posting");
  const count = await locator.count();

  console.log(`${count} jobs found in ${url}`)

  const results = [];

  for (let i = 0; i < count; i++) {
    let curLoc = locator.nth(i);

    let title = curLoc.locator("[data-qa='posting-name']")
    let location = curLoc.locator("span.location")
    let link = curLoc.locator(".posting-title");
    let description = "";

    const toCheck = [title, location, link];

    let exists = await Promise.all(toCheck.map((locator) => doesExist(locator)));

    title = exists[0] ? await title.innerText() : "";
    location = exists[1] ? await location.innerText() : "";
    link = exists[2] ? await link.getAttribute("href") : "";

    results.push({board, company, title, link, location, description})

  }

  return results;
}

const linkedin = async (context, url, waitFor) => {
  const board = "linkedin"

  let page;
  try {
    page = await setPage(context, url, waitFor);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page");
  }

  const locator = page.locator(".jobs-search__results-list li > div");
  const count = await locator.count();

  console.log(`${count} jobs found in ${url}`)

  const results = [];

  for (let i = 0; i < count; i++) {
    let curLoc = locator.nth(i);

    let title = curLoc.locator("h3")
    let location = curLoc.locator(".job-search-card__location")
    let link = curLoc.locator("a:not(.hidden-nested-link)");
    let company = curLoc.locator("h4");
    let description = "";

    const toCheck = [title, location, link, company];

    let exists = await Promise.all(toCheck.map((locator) => doesExist(locator)));

    title = exists[0] ? await title.innerText() : "";
    location = exists[1] ? await location.innerText() : "";
    link = exists[2] ? await link.getAttribute("href") : "";
    company = exists[3] ? await company.innerText() : "";

    results.push({board, company, title, link, location, description})

  }

  return results;

}

const jobvite = async (context, url, waitFor) => {
  const board = "jobvite"

  let page;
  try {
    page = await setPage(context, url, waitFor);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page");
  }

  const company = new URL(url).pathname.split("/")[1]

  const locator = page.locator("div.job-listings ul > a");
  const count = await locator.count();

  console.log(`${count} jobs found in ${url}`)

  const results = [];

  for (let i = 0; i < count; i++) {
    let curLoc = locator.nth(i);

    let title = curLoc.locator(".jv-job-list-name")
    let location = curLoc.locator(".jv-job-list-location")
    let link = "";
    let description = "";

    const toCheck = [title, location];

    let exists = await Promise.all(toCheck.map((locator) => doesExist(locator)));

    title = exists[0] ? await title.innerText() : "";
    location = exists[1] ? (await location.textContent()).split("\n").slice(-1)[0].trim() : "";
    link = "https://jobs.jobvite.com" + await curLoc.getAttribute("href");

    results.push({board, company, title, link, location, description})

  }

  return results;
}

const smartrecruiters = async (context, url, waitFor) => {
  const board = "smartrecruiters"

  let page;
  try {
    page = await setPage(context, url, waitFor);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page");
  }

  const company = new URL(url).pathname.split("/").slice(-1)[0]

  const locator = page.locator("div.js-openings-load section");
  const count = await locator.count();

  const interTot = page.locator("div.js-openings-load section > ul li")
  const nJobs = await interTot.count()

  console.log(`${nJobs} jobs found in ${url}`)

  const results = [];

  for (let i = 0; i < count; i++) {
    let curLoc = locator.nth(i);

    let location = await curLoc.locator("h3").innerText();

    let nestedLoc = curLoc.locator(".opening-jobs li")
    let nestedCount = await nestedLoc.count()

    for (let j = 0; j < nestedCount; j++) {
      let curNestLoc = nestedLoc.nth(j)
      let title = curNestLoc.locator("h4")
      let link = curNestLoc.locator("a")
      let description = "";

      const toCheck = [title, link];

      let exists = await Promise.all(toCheck.map((locator) => doesExist(locator)));

      title = exists[0] ? await title.innerText() : "";
      link = exists[1] ? await link.getAttribute("href") : "";

      results.push({board, company, title, link, location, description})
    }
  }

  return results;


}

///////////////////////////////////////////////////////////////////
///////////////////////// Main Task ///////////////////////////////
///////////////////////////////////////////////////////////////////

const mapper = [
  {
    url: "https://boards.greenhouse.io/translationunitedmastersstashed",
    waitFor: "#main",
    fct: greenhouse,
  },
  {
    url: "https://boards.greenhouse.io/vaynermedia",
    waitFor: "#main",
    fct: greenhouse,
  },
  {
    url: "https://jobs.lever.co/FIG?location=New%20York%2C%20NY",
    waitFor: "div.postings-wrapper",
    fct: lever,
  },
  {
    url: "https://www.linkedin.com/jobs/manifest-jobs-worldwide/?currentJobId=3602677738&f_C=31079&position=2&pageNum=0",
    waitFor: "main",
    fct: linkedin,
  },
  {
    url: "https://jobs.jobvite.com/essencemediacom-na/search?q=&l=New%20York,%20NY%20-%20175%20Greenwich%20Street",
    waitFor: "article.jv-page-body",
    fct: jobvite,
  },
  {
    url: "https://careers.smartrecruiters.com/PublicisGroupe/formerly-known-as",
    waitFor: "div.wrapper",
    fct: smartrecruiters,
  },
]

const runner = async () => {

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent: "Chrome/58.0. 3029.110",
    viewport: { width: 1512, height: 945 },
  });
  
  const jobs = []

  try {
    const datas = await Promise.allSettled(mapper.map((data) => {
      const {url, waitFor, fct} = data
      return fct(context, url, waitFor)
    }))
  
    datas.forEach((data) => {
      if (data.status === "fulfilled") {
        data.value.forEach((job) => {
          jobs.push(job)
        })
      }
    })
  } catch (error) {
    console.log(error)
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(jobs);

  return jobs
}

const writeCSV = () => {

  let data = "name,type\n";

  const write = ["me,idk", "you,hdk"]

  data = data + write.join("\n");

  fs.writeFile("./test.csv", data, (err) => {
    console.log(err || "done");
  });
}

// writeCSV();
runner();
