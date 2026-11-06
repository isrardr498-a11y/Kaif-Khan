# Trade Flow Pro — Live Market Simulator & Quant Academy

**Trade Flow Pro** is a complete, mobile-first Indian Market Trading Simulator (`NIFTY 50`, `BANKNIFTY`, `BTC/USDT`, `RELIANCE`), Candlestick Pattern Guide, Algo-Coding Lab, and 8-Chapter Hinglish Trading Book engineered to run seamlessly on **GitHub Pages** and compile directly into an **Android APK** via **GitHub Actions**.

---

## Key Features

1. **Live Market & Chart Terminal**
   - **3-Mode Market Speed Selector**: Switch real-time simulation speed anytime between **Scalping (Fast - 400ms)**, **Intraday (Normal - 1200ms, Default)**, and **Swing / Positional (Slow - 3000ms)**.
   - **Dual Charting Engine**: Works 100% offline using a custom hardware-accelerated HTML5 Canvas candlestick engine and upgrades automatically to TradingView `lightweight-charts` when online.
   - **Bar Replay & Zoom Controls**: Pause ticks (`⏸ Pause`), step forward candle-by-candle (`⏭ +1 Tick`), zoom in/out (`＋ Zoom` / `－ Zoom`), and fit chart.
   - **Order Execution & Indian Brokerage Math**: Market/Limit orders, 1x/5x Intraday leverage, Auto Stop-Loss & Take-Profit, live R:R calculation, and realistic Indian brokerage + STT + GST calculation.
2. **Demo Portfolio (`₹1,00,000` Virtual Capital)**
   - Persistent `localStorage` state, live unrealized P&L tracking, 1-tap `Trail SL → Cost`, and detailed closed trade ledger.
3. **Candlestick Patterns & Algo-Coding Lab**
   - 9 interactive custom SVG candlestick patterns with entry/SL/TP rules.
   - 6 Python & Pine Script v5 algorithmic trading lessons.
   - Interactive 100-candle EMA 9/21 Crossover Backtester & 1% Risk Position Sizing Calculator.
4. **8-Chapter Hinglish Trading Bible & 15-Question Trader Exam**
   - Complete 8-chapter curriculum with progress tracking and interactive scenario-based certification quiz.

---

## Automatic Android APK Build (GitHub Actions)

This repository includes a pre-configured GitHub Actions workflow at `.github/workflows/build-apk.yml` that automatically packages the app into an installable Android APK (`Trade-Flow-Pro.apk`) using **Capacitor** and **Android Gradle**.

### How to Get Your APK from GitHub:
1. Push or sync this project to your GitHub repository (`main` or `master` branch).
2. Open your repository on GitHub and click the **Actions** tab at the top.
3. Click on the **"Build Android APK (Trade Flow Pro)"** workflow run (or click **"Run workflow"** to trigger it manually anytime).
4. Wait ~2–3 minutes for the build job to finish with a green checkmark.
5. Scroll down to the **Artifacts** section at the bottom of the workflow summary page and download **`Trade-Flow-Pro-Android-APK`**.
6. Extract the zip file to get `Trade-Flow-Pro.apk` and install it directly on your Android phone!

---

## Local Development & Commands

```bash
# Start development server on port 3000
npm run dev

# Build production web bundle (outputs to dist/ with relative paths)
npm run build

# Run unit tests for trading math & brokerage engine
npm test
```
