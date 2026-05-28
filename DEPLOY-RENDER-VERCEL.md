# Deploy Stable Public Links (Render + Vercel)

This setup gives you long-running links:

- Frontend (site): Vercel
- Backend/API (bot + code endpoints): Render

## 1) Push latest code

```bash
git add .
git commit -m "Add Render and Vercel deployment configs"
git push
```

## 2) Deploy backend on Render

1. Open [Render Dashboard](https://dashboard.render.com/)
2. New -> **Blueprint**
3. Select repo: `charlesnduya-png/aviator-prediction`
4. Confirm `render.yaml`
5. Set env vars:
   - `PUBLIC_SITE_URL` = your Vercel URL (after step 3)
   - `WHATSAPP_PUSH_WEBHOOK` = your bot endpoint
   - `WHATSAPP_PUSH_AUTH_HEADER` = `x-api-key`
   - `WHATSAPP_PUSH_AUTH_TOKEN` = your token
6. Create service

Expected API URL:

- `https://aviator-prediction-api.onrender.com`

## 3) Deploy frontend on Vercel

1. Open [Vercel Dashboard](https://vercel.com/new)
2. Import repo: `charlesnduya-png/aviator-prediction`
3. Framework preset: **Other**
4. Root: project root
5. Deploy

Expected site URL (example):

- `https://aviator-prediction.vercel.app`

## 4) Update Render `PUBLIC_SITE_URL`

After Vercel gives your URL:

- Put that exact URL into Render env var `PUBLIC_SITE_URL`
- Redeploy Render service once

## 5) Verify

- Site opens publicly: `https://<your-vercel-domain>`
- API works: `https://<your-render-domain>/api/session-code`
- Bot receives code pushes during pre-live window.
