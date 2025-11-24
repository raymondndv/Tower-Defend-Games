[README.md](https://github.com/user-attachments/files/23711951/README.md)
# Tower Defend / Thủ Cửa – Bilingual Guide (English & Vietnamese)
Click to play:https://traetowerdefend3t81.vercel.app
## Overview / Tổng quan
- Tower defense with a hidden farm economy. Build towers to stop enemies; grow crops to earn gold to buy and upgrade towers.
- Difficulty starts high and increases; some maps have multiple start/end paths with cave/castle markers.

## Game Flow / Luồng vòng đấu
- After Start: wave info popup shows for 10s, then a 90s prep countdown starts automatically. When countdown reaches 0, the wave begins.
- After each wave: next wave info popup 10s → prep 90s → auto-start.
- Starting money floor per wave: `100 + 50 × wave` (keeps your higher farm balance; only raises if below).

## Economy / Kinh tế
- Gold is earned only from farming; enemies give no gold.
- Tower costs and upgrade costs are rounded to multiples of 5.

## Farm System / Hệ thống nông trại
- Layout: centered garden with 3×3 plots; click exact soil cell to plant.
- Crops (fixed 3 stages):
  - Stage 0: Sapling (just planted)
  - Stage 1: Growing (needs watering)
  - Stage 2: Mature (harvest)
- Growth times: Carrot 60s, Wheat 90s, Pumpkin 120s.
- Watering: in Stage 1, every 10s; watering is free.
- If overdue ≥ 20s without watering, the crop dies.
- Harvest rewards are fixed (no random): Carrot 25$, Wheat 40$, Pumpkin 70$.
- Watering tool: toggle on/off; when on, clicks water crops; when off, clicks plant/harvest.

## Controls / Điều khiển
- Left click: place tower / plant / water / harvest.
- Right click: cancel selected tower.
- `Tab`: switch between Combat ↔ Farm.

## Run Locally / Chạy tại máy
- Python:
  - Go to `c:\xampp\htdocs\tower_defend`.
  - Run: `python -m http.server 8000`.
  - Open: `http://localhost:8000/tower_defense.html`.
- XAMPP:
  - Put `tower_defend` under `htdocs`.
  - Start Apache.
  - Open: `http://localhost/tower_defend/tower_defense.html`.

## Deploy / Public
- GitHub Pages:
  - Push repo → Settings → Pages → Deploy from branch → `main` / root.
  - Open: `https://<username>.github.io/<repo>/tower_defense.html`.
  - Optional: rename `tower_defense.html` → `index.html` for root URL.
- Vercel:
  - Import GitHub repo → Framework “Other (Static)” → deploy.
  - Root serves static files; add `vercel.json` with rewrite `{ "/": "/tower_defense.html" }`.
- Netlify:
  - Add new site → Deploy manually → upload folder → open `tower_defense.html`.
- Ngrok:
  - Local server then `ngrok http 8000` (or `80`) to share a public URL.

## Troubleshooting / Sự cố thường gặp
- 404 on Vercel: ensure `vercel.json` rewrite or rename to `index.html`.
- Scripts not loading: check relative paths `js/...` and case sensitivity.
- Stuck switching modes: press `Tab` again; emergency fallback is enabled.

## Project Structure / Cấu trúc dự án
- `tower_defense.html` – main page
- `js/` – core logic:
  - `game.js` – game loop, waves, auto prep & popup
  - `input.js` – keyboard/mouse, mode switching
  - `map.js` – map drawing, cave/castle
  - `config.js` – configs (waves/towers)
  - `farm.js` – farm logic, stages, watering
  - `farm-ui.js` – farm UI, selectors, watecom

