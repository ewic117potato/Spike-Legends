# SPIKE LEGENDS — RIVAL ASCENSION v2.1 — HAIKYUU ROSTER 🏐

**GitHub → Render → (optional) Supabase.** Your computer does **not** need Node.js. Render installs Node automatically. This is an unofficial fan-made game using **Haikyuu!! character names**, with newly drawn simplified SVG portrait illustrations. It is **not affiliated with or endorsed by** the Haikyuu!! rights holders. The portraits are **not official anime screenshots or licensed character illustrations**. Public use of protected characters and franchise names may involve copyright/trademark permissions.

## New in v2.1: Haikyuu fan roster

- **52 real Haikyuu!! characters by name and team**, including Hinata, Kageyama, Oikawa, Bokuto, Ushijima, Kenma, Nishinoya, Atsumu and Osamu Miya, and many others.
- **52 individual, locally hosted portrait images**: custom simplified SVG fan illustrations with distinct hair, jersey colours and numbers. No external image hosting required.
- **156 collectible cards**, with Classic, Nationals and Awakened variants. Legendary/Mythic/Secret treatments remain visual rarity tiers.
- Player cards now show **character faces and school names**. Portraits appear on the dashboard, roster editor, inventory, summons, collection index and match court.
- Each character also has a named **signature move** on the card detail screen.
- **Online duel squad payload now includes the real positions and teams**, so the match engine can calculate position and school synergy correctly.
- **Existing browser/Supabase save keys are preserved.** The previous fictional athlete at each catalog slot becomes the new Haikyuu character occupying that slot. Coins, levels, squads, upgrades and quests remain saved.


- **Quest HQ** — 6 daily objectives, 5 weekly contracts, 6 permanent Legend Road milestones. Each objective displays real progress and claimable rewards.
- **Rare-card progression without luck** — earn Ascension Shards and forge **Epic+** (20 shards), **Legendary+** (65 shards), or **Mythic+** (180 shards) seals. Spend a seal to recruit a guaranteed high-rarity athlete.
- **Seven-day login track** — increasing rewards, including an Epic+ seal on day 7.
- **Rival Trials** — three increasingly difficult AI squads. Defeat all three to earn a guaranteed Epic+ recruit seal once daily.
- **Expanded summoning** — Epic+ pity after 10 pulls, Legendary+ after 40, Mythic+ after 150. Shiny variants appear at 2.5% probability.
- **Team chemistry** — matching schools and correct volleyball positions improve performance.
- **Three lineup presets** — save and reload your favorite starting six.
- **156-card collection index** — discover cards, compare rarities, find missing variants.
- **Polished live duel presentation** — new animated 2D volleyball court, commentary feed, special moves, better scoring overlays, MVPs.
- **Four tactical choices** — Balanced, Power Spikes, Iron Wall, Quick Tempo, selectable during a match.
- **Safer online rooms** — server-controlled rally scores, synchronized point events, room-code joining, two-player rematch consent, disconnect cancellation, cleanup and heartbeat.
- **Automatic checks** — a browser UI smoke test, match simulation unit test, WebSocket multiplayer smoke test, and GitHub Actions CI.

### Note about rare seals

Guaranteed rarity means **at least** the listed rarity. For example, an Epic+ seal can produce Legendary, Mythic or Secret if lucky. Shiny is purely cosmetic.

## Update an existing GitHub repository (recommended)

You have already created a public repository named `ewic117potato/SpikeLegends`.

1. Download and **extract** `Spike_Legends_Haikyuu_Roster_v2_1.zip`.
2. Open your existing repository on GitHub.
3. Choose **Add file → Upload files**.
4. Drag **everything inside** the extracted project folder into GitHub, preserving the folders `public/`, `server/`, `supabase/`, `test/` and `.github/`.
5. Verify `server.js`, `package.json` and `render.yaml` sit at the repository **root**, next to `public/`. Avoid a nested folder such as `Spike_Legends_Rival_Ascension_v2/Spike_Legends_GitHub_Render_Supabase/public/`.
6. Commit changes to `main`. If GitHub reports a conflict because you have edited one of these files, review the differences before overwriting.
7. Your connected **Render Web Service** should deploy the latest GitHub commit automatically. Otherwise: Render → your SpikeLegends service → **Manual Deploy → Deploy latest commit**.
8. Your existing `onrender.com` address should remain unchanged.

**Do not make a new GitHub repo or Render service** if your existing ones already work. Reusing the current repo preserves its connected Render service.

## If Render isn't set up yet

1. Go to https://dashboard.render.com → **New → Web Service**.
2. Connect GitHub and select `ewic117potato/SpikeLegends`.
3. Language: **Node**. Build: `npm install`. Start: `npm start`. Root directory: **blank**.
4. Choose an available instance type (Free if offered). Deploy.
5. Open the HTTPS `onrender.com` address Render gives you. Don't use `localhost`.
6. If the service is sleeping on a free plan, the first visitor may wait for it to wake up.

## Optional Supabase cloud saving

The game works without Supabase, but character progress is then saved **only in the browser**. To connect:

1. Go to https://supabase.com/dashboard → **New project** → create `SpikeLegends`.
2. In **SQL Editor**, run `supabase/OPTIONAL_CLOUD_SAVE.sql`.
3. Enable **Anonymous Sign-ins** in Authentication → Providers.
4. Copy the project's public Project URL and **publishable key**.
5. In Render → your SpikeLegends service → Environment, add:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_PUBLISHABLE_KEY` = your **publishable** key
6. Save/deploy, refresh the game, and verify the top bar indicates cloud saving is enabled.
7. In Supabase → Table Editor → `volleyball_saves`, confirm one row appears when your progress is saved.

**Never** upload a Supabase database password, secret key or service-role key into GitHub or the browser. The public/publishable key is safe to expose **only while database RLS is configured properly**. The included SQL enables ownership policies.

Cloud accounts are **anonymous and tied to each browser**. This version does not offer recoverable cross-device accounts. Do not clear browser storage without having another way to preserve progress.

## Multiplayer duels

1. Both players open the same Render URL.
2. Equip six athletes.
3. In **Duels**, host selects **Create Room** and copies the invitation link / six-character code.
4. Friend enters the code or opens the link.
5. Both click **Ready Up**. The match runs automatically with rallies calculated on the server.
6. Both players see identical scores and can change tactics while playing. After the match, both can request a rematch.

Rooms exist **in the Render service's RAM**. Deployments, sleep, server restarts, or a lost connection will end active games. Avoid deploying while your friends are competing. This version supports **1v1 friend duels**, not ranked matchmaking or real-time 6-player motion controls.

## Technical notes and limits

The frontend uses HTML/CSS/JavaScript. The backend uses the `ws` WebSocket module. Supabase cloud saves the full profile JSON, including new quest metadata, using the original `volleyball_saves` table — **no new SQL migration is required** if you ran the earlier SQL script.

**Important competitive limitation:** The backend synchronizes rally outcomes and scores, but player inventories, stats, coins, quests and rewards remain browser-controlled. Cheating is therefore possible. This release is an enjoyable prototype for friends, **not a fully verified anti-cheat/economy system**. Do not use it for paid rolls, real-money transactions or prize competitions.

This remains an animated **2D arcade-style match view**, not a 3D Roblox animation engine. Portrait artwork is stylized fan interpretation, not exact anime frame captures.

## Automated tests (optional for developers)

On Render and GitHub Actions, `npm install` installs Node dependencies. To run locally if Node is available:

```sh
npm install
npm run test:engine
npm run test:roster
npm test
```

The game also includes `test/frontend-expanded.py` for optional Chromium/Playwright smoke testing (not part of normal deployment).

**Validation of this roster upgrade:** JavaScript syntax passed. The new roster test passed for 52 named characters, 156 cards, locally present portraits, non-empty rarity pools and six starting players. The existing match-engine unit test passed. A full live Render multiplayer test and automated browser UI run could not be completed in this environment; verify after deploying with two browsers.

## Files

```text
SpikeLegends/
├── public/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── expansion.js       # Quests, rare cards, trials, duel interface
│   ├── haikyuu-data.js   # 52 named character definitions
│   ├── portraits/        # 52 individual local SVG images
│   └── cloud.js
├── server/
│   └── match-engine.js    # Server-authoritative tactics and rally results
├── server.js             # Express-free HTTP + WebSocket server
├── supabase/
│   └── OPTIONAL_CLOUD_SAVE.sql
├── test/
├── .github/workflows/
├── render.yaml
├── package.json
├── SETUP_FIRST.txt
└── README.md
```
