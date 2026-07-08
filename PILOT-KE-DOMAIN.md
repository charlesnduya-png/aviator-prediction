# pilot.ke — GitHub Pages hosting

## Live deployment (GitHub Pages)

| URL | Host |
|-----|------|
| **https://pilot.ke** | GitHub Pages (custom domain) |
| **https://www.pilot.ke** | Add `www` in GitHub Pages settings + DNS CNAME |
| **https://charlesnduya-png.github.io/aviator-prediction/** | GitHub Pages default URL |

**Deploy:** push to `main` on GitHub — workflow `.github/workflows/deploy-pages.yml` publishes automatically.

```bash
git add .
git commit -m "Update site"
git push origin main
```

Or trigger manually: GitHub repo → **Actions** → **Deploy to GitHub Pages** → **Run workflow**.

---

## DNS at Truehost (switch from Vercel)

Remove Vercel records (`76.76.21.21`, `cname.vercel-dns.com`) and add:

| Type | Host | Value |
|------|------|--------|
| **A** | `@` | `185.199.108.153` |
| **A** | `@` | `185.199.109.153` |
| **A** | `@` | `185.199.110.153` |
| **A** | `@` | `185.199.111.153` |
| **CNAME** | `www` | `charlesnduya-png.github.io` |

In GitHub: **Settings → Pages → Custom domain** → `pilot.ke` (CNAME file is in repo).

HTTPS is issued automatically after DNS verifies (5–60 minutes).

---

## Earlier: Vercel (paused)

Vercel deploy is no longer used. Frontend is static on GitHub Pages.