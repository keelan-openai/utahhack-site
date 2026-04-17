# University of Utah x OpenAI Hackathon Site

Static landing page for the University of Utah x OpenAI Hackathon: **Build with AI: AI for Every Discipline**.

This project is a lightweight HTML/CSS/JS site designed to run locally for live event support and to deploy cleanly to Vercel.

## Live URLs

- Production: `https://utahhack-2026.vercel.app`
- Canonical project URL: `https://utahhack.vercel.app`
- GitHub: `https://github.com/keelan-openai/utahhack-site`

## What is in the site

- Utah-branded landing page for the April 17, 2026 virtual hackathon
- Live countdowns for hackathon start and submission deadline
- Office hours booking section with Calendly embed
- Embedded Google Form for project submission
- Developer resources section with repo link and clone command
- Local QR poster and favicon assets

## Project structure

```text
.
├── app.js
├── assets/
├── docs/
│   └── DEPLOYMENT.md
├── index.html
├── package.json
├── styles.css
└── README.md
```

## Run locally

This is a static site, so the fastest local preview is a simple HTTP server.

### Python

```bash
cd "/Users/keelan/Documents/UU Hack"
python3 -m http.server 3000
```

Then open:

`http://127.0.0.1:3000/`

## Edit workflow

Primary files:

- `index.html`: page structure and content
- `styles.css`: layout, typography, branding, responsive behavior
- `app.js`: countdown timers and small interaction logic
- `assets/`: favicon, QR poster, and other local visuals

## Event links currently used

- Utah AI event page: `https://ai.utah.edu/blog/posts/2026/build_with_ai_hackathon.php`
- ChatGPT Edu access: `https://ai.utah.edu/tools/chatgpt/index.php`
- Office hours: `https://calendly.com/keelan-wm_9/uu-hackathon-office-hours`
- Submission form: `https://docs.google.com/forms/d/e/1FAIpQLScb0vZQQ_H_PIz9ZP9Kp9OFBqV8rpLAMMB-Bjl7Ja0nJhBUHw/viewform?usp=send_form`

## Deploy

This project is already linked to Vercel. For release notes and deployment steps, see:

`docs/DEPLOYMENT.md`

## Notes

- `.vercel/` is ignored locally
- `node_modules/` is ignored locally
- The page is designed to work as a plain static deploy with no build step
