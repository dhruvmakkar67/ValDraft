# 🎴 ValDraft — Valorant Agent Auction & AI Composition Duel

> A real-time two-player card pick game featuring turn-by-turn incremental auctions, economic balance management, gacha agent reveals, and AI-powered composition rating on official Valorant competitive maps.

---

## ⚡ Features

- **Turn-by-Turn Incremental Auction**: Bid against your opponent in a live auctioneer format (+100, +250, +500, ALL IN) with a 9-second turn clock and pass mechanism.
- **Gacha Agent Reveals**: Each round pulls a random undrafted Valorant agent with their competitive tier (S, A, B, C), base cost, and signature abilities.
- **Starting Budget Economy**: Both players start with **10,000 Credits**. High bidders pay their bid upon hammer drop; if your balance runs out before 5 agents, the remaining slots are auto-filled with random agents for free.
- **All 29 Official Playable Agents**: Transparent HD portraits, roles (Duelist, Initiator, Controller, Sentinel), abilities, and competitive tier ratings from the official Valorant API.
- **Standard Competitive Map Pool**: Ascent, Bind, Haven, Split, Icebox, Breeze, Lotus, Sunset, Abyss, and Pearl with official splash arts and tactical meta characteristics.
- **Dual AI Composition Rating Engine**:
  - **Google Gemini 2.5 Flash**: Delivers a full pro VCT broadcast breakdown, win probability, site execute ratings, and ability combos.
  - **Local VCT Tactical Evaluator Fallback**: Automatically evaluates comps if no API key is set, scoring site execution, info gathering, map control, flexibility, and synergy.
- **Solo vs AI Bot & Online 2-Player Modes**: Instant 1-click test against **Viper Bot (AI)** or create a lobby and invite a friend with a 6-character room code.
- **Synthesized Audio Engine**: Zero-asset Web Audio API sound effects for card reveals, token bids, hammer drops, countdown ticks, and victory chimes.

---

## 🚀 Quickstart

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**!

---

## 🔑 Optional: Google Gemini API Key
You can add your Gemini API key in `backend/.env` or click the **"GEMINI AI"** button in the app navbar to paste your key anytime:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).
*(Note: If left empty, ValDraft uses its built-in tactical evaluator engine seamlessly!)*

---

## 🕹️ Game Rules
1. **Map Selected**: A random competitive map is chosen.
2. **Card Flipped**: One random undrafted agent is revealed.
3. **Turn-by-Turn Bidding**:
   - Starting player opens the bidding or passes.
   - Opponent can counter-raise or pass within the 9s turn clock.
   - The last bidder wins the agent when the other passes.
4. **Draft Completed**: Once both teams have 5 agents, the AI analyzes both squads head-to-head on the map and crowns the winner!
