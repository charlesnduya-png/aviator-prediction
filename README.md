# Aviator Pro Predictor — Final Release

Professional Aviator crash analytics app for **Janta.ke** (#1 pick) and **Betika** (Room 1, 2, 3). Works on phone as an installable app (PWA) or in any browser.

---

## What’s included

| Feature | Description |
|---------|-------------|
| **Global prediction** | Next plane crash signal + confidence |
| **Janta.ke** | Premium tier, hyped UI, link to [janta.ke Aviator](https://janta.ke/home/game/aviator) |
| **Betika** | 3 servers (Room 1–3), link to [betika.com Aviator](https://www.betika.com/en-ke/aviator) |
| **Live updates** | Refreshes every 3 seconds |
| **Phone app** | QR install, bottom nav, full-screen PWA |
| **Copy tips** | Copy prediction to use on Janta/Betika |

---

## Run on your phone

1. Double-click **`start-phone-server.bat`**
2. Connect phone to **same Wi-Fi** as PC
3. **Scan the QR code** on the PC screen (or open the link shown)
4. **Install:** Android → Install app · iPhone → Share → Add to Home Screen

---

## Run on PC

- Double-click **`index.html`**, or  
- After starting the server: **http://localhost:8080**

---

## Public link (Netlify)

**Live site:** https://jocular-pithivier-dc1b63.netlify.app  
**Access:** Enter the generated session code shown by your bot/app to unlock.

To redeploy: double-click **`DEPLOY-NETLIFY-DROP.bat`** or run:
`npx netlify-cli deploy --prod --dir netlify-publish --allow-anonymous`

## Share the ZIP

1. Send **`AVIATOR-PRO-FINAL.zip`** (create with `CREATE-FINAL-ZIP.bat`)
2. Friend unzips → runs **`start-phone-server.bat`**

---

## Project files

```
AVIATOR PREDICTION/
├── index.html              Main app
├── styles.css              Styles
├── app.js                  Prediction engine
├── manifest.webmanifest    PWA manifest
├── sw.js                   Offline cache
├── scan.html               QR code page
├── start-phone-server.bat  Start server + QR
├── server.js               Node server (recommended)
├── server.py               Python server (optional)
├── icons/                  App icons
├── scripts/                Helper scripts
├── START-HERE.txt          Quick guide
└── README.md               This file
```

---

## Requirements

- **Windows** with **Node.js** (preferred) or **Python** for phone server  
- Modern browser (Chrome, Edge, Safari)  
- Same Wi-Fi for phone + PC (local network)

---

## Disclaimer

Uses simulated pattern analysis for demonstration. Real Aviator outcomes are random. **Gamble responsibly. 18+ only.**
