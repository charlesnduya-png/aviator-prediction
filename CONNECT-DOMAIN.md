# Connect Your Own Domain (Netlify)

Your app: **https://jocular-pithivier-dc1b63.netlify.app**

You need a **claimed** Netlify site before adding a custom domain.

---

## Step 1 — Claim the site (required)

1. Log in at **https://app.netlify.com** (free account).
2. If the site is not listed, redeploy: run **`DEPLOY-NETLIFY-DROP.bat`**, then open the **Claim** link from the terminal output.
3. Or: **Sites** → find `jocular-pithivier-dc1b63` → **Claim** if prompted.

---

## Step 2 — Add your domain in Netlify

1. Open your site in the Netlify dashboard.
2. Go to **Site configuration** → **Domain management** (or **Domains**).
3. Click **Add a domain** → **Add a domain you already own**.
4. Enter your domain, e.g.:
   - `aviatorpro.com`
   - `predict.yourdomain.com` (subdomain)

5. Netlify shows **DNS records** to add at your registrar (Namecheap, GoDaddy, Cloudflare, etc.).

---

## Step 3 — DNS at your domain provider

### Root domain (`yourdomain.com`)

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `75.2.60.5` |
| **CNAME** | `www` | `jocular-pithivier-dc1b63.netlify.app` |

*(Netlify may show slightly different IPs — use what your dashboard shows.)*

### Subdomain only (`app.yourdomain.com`)

| Type | Name | Value |
|------|------|--------|
| **CNAME** | `app` | `jocular-pithivier-dc1b63.netlify.app` |

### If you use Cloudflare

- Set DNS records as above.
- SSL/TLS mode: **Full** or **Full (strict)**.
- Turn off “Proxy” (orange cloud) first if SSL fails, then turn back on after Netlify cert is ready.

---

## Step 4 — HTTPS (automatic)

1. In Netlify: **Domain management** → your domain.
2. Wait for **DNS verification** (minutes to 48 hours).
3. Netlify issues a **free SSL certificate** automatically.
4. Enable **Force HTTPS** (recommended).

---

## Step 5 — Access code (your site)

Netlify password protection is not required for this setup.
Users unlock the app with the generated session code shown in-app/WhatsApp.

---

## Quick checklist

- [ ] Netlify account + site claimed  
- [ ] Domain added in Netlify  
- [ ] DNS records added at registrar  
- [ ] DNS verified (green in Netlify)  
- [ ] HTTPS active  
- [ ] Share: `https://yourdomain.com` + password if you keep it  

---

## Example

| What you buy | What users open |
|--------------|-----------------|
| `aviatorpro.co.ke` | `https://aviatorpro.co.ke` |
| Subdomain `play.mysite.com` | `https://play.mysite.com` |

---

## Truehost (your registrar)

Truehost uses **DNS Management** in the client area or **Zone Editor** in cPanel.

Guide: [Truehost — manage DNS in cPanel](https://truehost.com/support/knowledge-base/manage-and-reset-dns-records-using-zone-editor-in-cpanel/)

### Method 1 — Truehost client area

1. Log in: **https://truehost.co.ke/cloud/** (or truehost.com client area)
2. **Domains** → **My Domains**
3. Click **Manage** on your domain
4. Open **DNS Management**
5. Add these rows:

| Host name | Record type | Address / Value |
|-----------|-------------|-----------------|
| `@` | **A** | `75.2.60.5` |
| `www` | **CNAME** | `jocular-pithivier-dc1b63.netlify.app` |

6. Save. Changes can take **12–24 hours** (often faster).

### Method 2 — cPanel Zone Editor

1. Log in to **cPanel** (link from Truehost email or client area)
2. **Domains** → **Zone Editor** → **Manage** (your domain)
3. **Add Record**:

**A record**

| Field | Value |
|-------|--------|
| Name | `@` or leave blank for root |
| Type | A |
| Address | `75.2.60.5` |
| TTL | 14400 (default) |

**CNAME record**

| Field | Value |
|-------|--------|
| Name | `www` |
| Type | CNAME |
| Record | `jocular-pithivier-dc1b63.netlify.app` |

4. **Delete** old A records for `@` and `www` that point to Truehost parking if they conflict.
5. In **Netlify** → add the same domain under **Domain management**.

### Subdomain on Truehost (e.g. `aviator.yourdomain.co.ke`)

| Host name | Record type | Address |
|-----------|-------------|---------|
| `aviator` | **CNAME** | `jocular-pithivier-dc1b63.netlify.app` |

---

## Need a cheap domain?

- [Truehost](https://truehost.co.ke)
- [Namecheap](https://www.namecheap.com)

After you buy a domain, follow Steps 2–4 above.
