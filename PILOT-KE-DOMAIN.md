# pilot.ke — same domain, hosted on GitHub Pages

**Your site URL stays `https://pilot.ke`** — only hosting moved from Vercel to GitHub. The domain is linked to this repo via the `CNAME` file and GitHub Pages settings.

## Current setup

| Item | Status |
|------|--------|
| Domain | **pilot.ke** (unchanged) |
| GitHub repo | `charlesnduya-png/aviator-prediction` |
| Deploy | Push to `main` → GitHub Actions |
| Custom domain in GitHub | **pilot.ke** ✓ |

## DNS at Truehost (one-time switch from Vercel → GitHub)

`pilot.ke` still points to Vercel (`76.76.21.21`). Update records so the **same domain** serves GitHub Pages:

| Type | Host | Value |
|------|------|--------|
| **A** | `@` | `185.199.108.153` |
| **A** | `@` | `185.199.109.153` |
| **A** | `@` | `185.199.110.153` |
| **A** | `@` | `185.199.111.153` |
| **CNAME** | `www` | `charlesnduya-png.github.io` |

Remove Vercel-only records (`76.76.21.21`, `cname.vercel-dns.com`).

After DNS propagates, **https://pilot.ke** works again — same address for users, new host behind it.

## Deploy after edits

```bash
git add .
git commit -m "Update site"
git push origin main
```