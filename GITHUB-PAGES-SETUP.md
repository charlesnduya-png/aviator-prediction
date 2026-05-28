# GitHub Pages Hosting Setup

Your project is now prepared for GitHub Pages deployment.

## 1) Create a GitHub repository

Create a new repo in GitHub, for example:

- `aviator-prediction`

## 2) Push this project

Run in this folder:

```bash
git init
git add .
git commit -m "Prepare site for GitHub Pages"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 3) Enable GitHub Pages

In your repo:

- `Settings` -> `Pages`
- `Build and deployment` -> `Source`: **GitHub Actions**

The workflow file `.github/workflows/deploy-pages.yml` will publish automatically.

## 4) Your hosted link

Platform subdomain URL format:

- `https://<your-username>.github.io/<your-repo>/`

## Important note about backend endpoints

GitHub Pages hosts static files only. It does **not** run `server.js`.
So these endpoints will not work on Pages unless hosted separately:

- `/incoming-sme-code`
- `/api/session-code`

If you want, we can keep GitHub Pages for frontend and move backend API to Render/Railway/Cloudflare Workers.
