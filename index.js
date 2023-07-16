import { chromium } from "playwright";
import fs from "fs";
import { mapper } from "./utils/urls.js";


///////////////////////////////////////////////////////////////////
///////////////// General Web Scraping Helpers ////////////////////
///////////////////////////////////////////////////////////////////

const setPage = async (context, url, waitFor) => {

  console.log(`FETCHING ${url}`);

  const page = await context.newPage();
  page.setDefaultTimeout(1_000);

  try {
    await page.goto(url, { timeout: 2_000 });
  } catch (error) {
    await page.close();
    console.log("Timeout in goto", error.message)
    return Promise.reject("Timeout in goto" + error.message)
  }

  try {
    await page.waitForSelector(waitFor, {
      state: "attached",
      timeout: 5_000,
      strict: false,
    });
  } catch (error) {
    await page.close();
    console.log("Timeout in waitForSelector", error.message)
    return Promise.reject("Timeout in waitForSelector" + error.message)
  }

  return page;
}

///////////////////////////////////////////////////////////////////
///////////////////////// Main Task ///////////////////////////////
///////////////////////////////////////////////////////////////////

const runner = async () => {

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent: "Chrome/58.0. 3029.110",
    viewport: { width: 1512, height: 945 },
  });
  
  const jobs = []

  try {
    const datas = await Promise.allSettled(mapper.map((data) => {
      const {url, fct} = data
      return fct(context, url, setPage)
    }))
  
    datas.forEach((data) => {
      if (data.status === "fulfilled") {
        data.value.forEach((job) => {
          jobs.push(job)
        })
      } else {
        console.log(data.reason)
      }
    })
  } catch (error) {
    console.log(error)
  } finally {
    await context.close();
    await browser.close();
  }

  return jobs
}

const main = async () => {

  const jobs = await runner()

  const header = ["company", "title", "board", "link", "location", "description"]

  const dataWrite = []
  jobs.forEach(job => {
    const hyperlink = `=HYPERLINK(""${job.link}"",""Link"")`
    const inter = [job.company, job.title, job.board, hyperlink, job.location, job.description]
    dataWrite.push(inter.join("\t"))
  })

  let data = header.join("\t") + "\n"
  data += dataWrite.join("\n")

  fs.writeFile("./listings.tsv", data, (err) => {
    console.log(err || "\nDONE --- Written to listings.tsv\n");
  });
}

main();
