import { greenhouse, lever, linkedin, jobvite, smartrecruiters } from "./site_scrapers.js"

// Add to here as you need.
export const mapper = [
  {
    url: "https://boards.greenhouse.io/translationunitedmastersstashed",
    fct: greenhouse,
  },
  {
    url: "https://boards.greenhouse.io/vaynermedia",
    fct: greenhouse,
  },
  {
    url: "https://jobs.lever.co/FIG?location=New%20York%2C%20NY",
    fct: lever,
  },
  {
    url: "https://www.linkedin.com/jobs/manifest-jobs-worldwide/?currentJobId=3602677738&f_C=31079&position=2&pageNum=0",
    fct: linkedin,
  },
  {
    url: "https://jobs.jobvite.com/essencemediacom-na/search?q=&l=New%20York,%20NY%20-%20175%20Greenwich%20Street",
    fct: jobvite,
  },
  {
    url: "https://careers.smartrecruiters.com/PublicisGroupe/formerly-known-as",
    fct: smartrecruiters,
  },
]