# Deployment Runbook

## Project summary

- Project: University of Utah x OpenAI Hackathon site
- Repo: `https://github.com/keelan-openai/utahhack-site`
- Current production-style Vercel URL: `https://utahhack-2026.vercel.app`

## Local verification before push

Run from the project root:

```bash
cd "/Users/keelan/Documents/UU Hack"
python3 -m http.server 3000
```

Verify:

- Home page loads at `http://127.0.0.1:3000/`
- Countdown timers render and tick
- Office hours embed loads cleanly
- Submission form section appears
- Developer resources section points to the GitHub repo

## Git workflow

```bash
cd "/Users/keelan/Documents/UU Hack"
git status
git add .
git commit -m "Update hackathon site docs and content"
git push origin main
```

## Vercel workflow

If Vercel is already linked, a push to the connected GitHub repo should trigger deployment.

Manual deploy fallback:

```bash
cd "/Users/keelan/Documents/UU Hack"
npx vercel --prod
```

## Canonical metadata

If the public URL changes, update these values in `index.html`:

- `<link rel="canonical" ...>`
- `og:url`
- any matching public URL references in page metadata

## Assets worth keeping in sync

- `assets/favicon.svg`
- `assets/submission-qr-poster.svg`
- any Utah/OpenAI badges used by the landing page

## Recommended release checklist

1. Confirm event copy, schedule, and links are correct.
2. Check the countdown timestamps.
3. Confirm the office hours Calendly link still works.
4. Confirm the Google Form submission link still works.
5. Push to GitHub.
6. Verify the latest Vercel deploy.
