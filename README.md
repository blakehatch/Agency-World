# Agency-World

Runs the async webscraper to grab job openings from various sites.

## First-go
Run `yarn install` from the root directory to install the dependencies.
Only will need to do this once.

## Running
`node .`

## Updating URLs
Edit the `./utils/urls.js` file

Make sure you add the associated function call for that url, and the proper structure.
The existing `urls.js` file should help determine what this looks like.

Any new URL's that don't fall into the following site categories will require additional development:
- greenhouse
- lever
- linkedin
- jobvite
- smartrecruiters
