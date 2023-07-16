const doesExist = async (locator) => {

  let count;
  try {
    count = await locator.count();
  } catch (error) {
    return false;
  }
  return count > 0;
}

export const greenhouse = async (context, url, pageSetter) => {
  const board = "greenhouse"
  const waitFor = "#main"

  let page;
  try {
    page = await pageSetter(context, url, waitFor);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page", error.message);
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

  await page.close()

  return results;
}

export const lever = async (context, url, pageSetter) => {
  const board = "lever"
  const waitFor = "div.postings-wrapper"
  
  let page;
  try {
    page = await pageSetter(context, url, waitFor);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page", error.message);
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

  await page.close()

  return results;
}

export const linkedin = async (context, url, pageSetter) => {
  const board = "linkedin"
  const waitFor = "main"

  let page;
  try {
    page = await pageSetter(context, url, waitFor);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page", error.message);
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

  await page.close()

  return results;

}

export const jobvite = async (context, url, pageSetter) => {
  const board = "jobvite"
  const waitFor = "article.jv-page-body"

  let page;
  try {
    page = await pageSetter(context, url, waitFor);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page", error.message);
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

  await page.close()

  return results;
}

export const smartrecruiters = async (context, url, pageSetter) => {
  const board = "smartrecruiters"
  const waitFor = "div.wrapper"

  let page;
  try {
    page = await pageSetter(context, url, waitFor);
  } catch (error) {
    console.log(error)
    return Promise.reject("couldn't set page", error.message);
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

  await page.close()

  return results;
}