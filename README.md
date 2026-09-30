# Trivista Labs website

The public website of Trivista Labs (Pvt) Ltd, live at [trivistalabs.io](https://trivistalabs.io), and the small API behind its contact form.

| Folder | What it is | Where it runs |
| --- | --- | --- |
| [`frontend/`](frontend/) | Static site built with [Astro](https://astro.build), with React only for the contact form | GitHub Pages, deployed on every push to `main` |
| [`backend/`](backend/) | Express API that emails contact form enquiries to the team | Render |

## Working on the site

You need Node.js 22.12 or newer.

```bash
cd frontend
npm install
npm run dev          # http://localhost:4321, with draft projects visible
```

The contact form posts to the production API by default. To work against a local API instead, copy `frontend/.env.example` to `frontend/.env` and set `PUBLIC_CONTACT_API_URL=http://localhost:5000`, then start the backend (below).

| Command (in `frontend/`) | What it does |
| --- | --- |
| `npm run dev` | Development server with drafts shown |
| `npm run build` | Production build into `dist/` (drafts excluded) |
| `npm run preview` | Serves the production build |
| `npm run check` | Type checks the project |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint, including the React hooks rules |
| `npm run test:e2e` | Builds, then runs the browser tests: layout at six widths, navigation, the contact form, a JavaScript budget and WCAG 2.2 AA checks. Stop any running `npm run preview` first, because Astro allows one preview server per project. |
| `npm run assets -- --source <folder>` | Rebuilds founder portraits, the logo mark, icons and the share image from original files |

### Where content lives

| To change | Edit |
| --- | --- |
| Company facts: email, address, social links, legal name | `frontend/src/data/site.ts` |
| Capabilities | `frontend/src/data/capabilities.ts` |
| Founders | `frontend/src/data/founders.ts` and the photos in `frontend/src/assets/founders/` |
| "How we build" stages | `frontend/src/data/process.ts` |
| Engineering principles and the facts about this site | `frontend/src/data/principles.ts` |
| Projects and case studies | One Markdown file per project in `frontend/src/content/work/` |
| Privacy Policy and Terms | `frontend/src/pages/privacy.astro` and `terms.astro` |

### Adding a project

Create `frontend/src/content/work/<project>.md`. The fields are checked when the site builds (see `src/content.config.ts`):

```yaml
---
title: Project name
summary: One or two sentences on what it is and who it is for.
category: Booking system
capability: business-systems   # products, business-systems, hardware-iot or infrastructure
status: live                   # live, in-development, internal or completed
url: https://example.com       # optional public link
cover: ./images/project.png    # optional screenshot, kept next to the file
coverAlt: The booking calendar for a single branch
caseStudy: true                # true gives the project its own page under /work/
draft: false                   # drafts never reach the live site
---

## Context
...
```

Only publish verified facts, and name clients only with their permission. Draft entries show in `npm run dev` and in builds made with `PUBLIC_SHOW_DRAFTS=true`, with a checklist of what is still missing.

### Design system

Colours, type scale, spacing, radii and motion are CSS custom properties in `frontend/src/styles/tokens.css`. Components use the tokens instead of fixed values. The palette is warm ivory with charcoal and Trivista teal. Bright teal (`--teal`) is for graphics and dark sections; text links on light backgrounds use `--teal-ink`, because bright teal on ivory is too low in contrast to read.

### Keeping the site's claims true

The home page lists facts about this website, such as how much JavaScript it ships, in `frontend/src/data/principles.ts`. Visitors can check them in their browser, so they must stay accurate:

- A browser test in `tests/e2e/site.spec.ts` fails if the home page ships 1 KB or more of compressed JavaScript.
- If you add analytics, cookies or third-party scripts, update those facts, the Privacy Policy and the Content-Security-Policy together.
- Capability, project and founder copy should only state what the founders have confirmed.

## Contact API

```bash
cd backend
cp .env.example .env   # then fill in EMAIL_USER and EMAIL_PASS
npm install
npm run dev            # http://localhost:5000
npm test
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `EMAIL_USER` | Yes | Gmail account the API sends from |
| `EMAIL_PASS` | Yes | A Google app password for that account |
| `CONTACT_TO` | No | Where enquiries go. Defaults to `EMAIL_USER` |
| `CORS_ORIGINS` | No | Comma-separated browser origins allowed to call the API |
| `TRUST_PROXY_HOPS` | No | Proxies in front of the API. Defaults to 1, which suits Render |

`POST /api/contact` accepts `name`, `email`, `message` and optionally `company`, `projectType` and `timeline`. Every field is validated and HTML-escaped before it reaches the email. Each visitor can send 5 messages per 15 minutes, with IPv6 addresses grouped by /56 so one allocation counts as one visitor, and the API accepts at most 60 messages an hour in total, so a flood cannot use up the Gmail account's sending quota. A hidden `contact_ref` field catches automated senders: the API answers them as if it worked and sends nothing. `GET /api/health` reports that the service is up; the contact page calls it on load so the server is awake by the time someone submits.

After deploying the API to Render, check that the rate limit sees real visitor addresses: send a few test messages from two different networks and confirm they are limited separately. If every visitor shares one limit, Render has more than one proxy in front of the app; increase `TRUST_PROXY_HOPS`.

## Deployment

- **Website:** every push to `main` runs `.github/workflows/deploy.yml`, which type checks, runs the unit tests, builds, runs the browser and accessibility tests, and publishes `frontend/dist` to GitHub Pages under the domain in `CNAME`. If any check fails, nothing is published and the live site stays as it was.
- **Checks:** pull requests and other branches run `.github/workflows/ci.yml`: API tests and a dependency audit, type check, unit tests, lint, the production and draft-preview builds, and the browser and accessibility tests.
- **API:** deployed on Render from the `backend/` folder. Set the environment variables above in the Render dashboard.

### Security headers

The site sets a strict Content-Security-Policy in every page's `<meta>` tag, with hashes for each inline script and style. GitHub Pages cannot send other security headers, such as HSTS, X-Frame-Options and Referrer-Policy. `frontend/public/_headers` already defines them for hosts that support it (Cloudflare Pages, Netlify), so moving hosts is enough to switch them on.

### Analytics

Click tracking is wired but sends nothing yet. Adding a cookie-free provider such as Plausible or Umami turns it on: add the provider's script to `frontend/src/components/BaseHead.astro` and its domain to the CSP in `frontend/astro.config.mjs`. Tracked events: contact form sent, "Start a project" clicks, email clicks and social profile clicks. Update the Privacy Policy at the same time.
